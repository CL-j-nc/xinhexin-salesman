import type { CRMCustomer, CRMVehicle } from "./crmStorage";
import { ApiRequestError, fetchJsonWithFallback, probeApiHealth } from "./apiClient";

// 扩展数据类型 - 生产环境专用
export interface VehicleProfile {
    vehiclePolicyUid: string;
    plate: string;
    vin: string;
    currentStatus: string;
    lastContactTime?: string;
    policySummary?: {
        latestPolicyNo: string;
        effectiveDate: string;
        expiryDate: string;
        isExpired: boolean;
    };
    contacts: Contact[];
    flags: Flag[];
}

export interface Contact {
    contactId: string;
    roleType: string; // 车主/投保人/被保险人
    name: string;
    idType: string;
    idNo: string;
    phone: string;
}

export interface TimelineEvent {
    timelineId: string;
    eventType: string;
    eventDesc: string;
    eventTime: string;
}

export interface Interaction {
    interactionId: string;
    contactMethod: string;
    topic: string;
    result: string;
    followUpStatus: string;
    interactionTime: string;
    operatorName: string;
}

export interface InteractionInput {
    vehiclePolicyUid: string;
    contactMethod: string;
    topic: string;
    result: string;
    followUpStatus: string;
    operatorName: string;
}

export interface Flag {
    flagId: string;
    flagType: string;
    flagNote: string;
    isActive: boolean;
    createdAt: string;
    createdBy: string;
}

export interface FlagInput {
    vehiclePolicyUid: string;
    flagType: string;
    flagNote: string;
    createdBy: string;
}

export interface CRMHealthResult {
    ok: boolean;
    baseUrl?: string;
    reason?: string;
}

const isNotFound = (error: unknown): boolean =>
    error instanceof ApiRequestError && error.kind === "http" && error.status === 404;

const toApiError = (error: unknown): ApiRequestError =>
    error instanceof ApiRequestError
        ? error
        : new ApiRequestError({ kind: "network", message: "网络请求失败", cause: error });

// 统一数据源接口
export interface CRMDataSource {
    // 客户相关
    searchCustomers(query: string): Promise<CRMCustomer[]>;
    getCustomer(id: string): Promise<CRMCustomer | null>;
    addCustomer(customer: Omit<CRMCustomer, "id" | "createdAt" | "usageCount">): Promise<CRMCustomer>;
    updateCustomerUsage(id: string): Promise<void>;

    // 车辆相关
    searchVehicles(query: string): Promise<CRMVehicle[]>;
    getVehicle(plateOrVin: string): Promise<CRMVehicle | null>;
    addVehicle(vehicle: Omit<CRMVehicle, "id" | "createdAt" | "usageCount">): Promise<CRMVehicle>;
    updateVehicleUsage(id: string): Promise<void>;

    // 健康检查
    checkHealth(): Promise<CRMHealthResult>;

    // 生产环境专用功能
    getVehicleProfile(plateOrVin: string): Promise<VehicleProfile | null>;
    getTimeline(vehicleUid: string): Promise<TimelineEvent[]>;
    getInteractions(vehicleUid: string): Promise<Interaction[]>;
    addInteraction(interaction: InteractionInput): Promise<Interaction>;
    getFlags(vehicleUid: string): Promise<Flag[]>;
    addFlag(flag: FlagInput): Promise<Flag>;
}

/**
 * DatabaseSource - 唯一数据源实现
 * 所有数据通过 Cloudflare D1 API 存取
 * 不允许任何本地存储回退
 */
class DatabaseSource implements CRMDataSource {
    private async requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
        return fetchJsonWithFallback<T>(path, init);
    }

    private async requestWithoutBody(path: string, init: RequestInit = {}): Promise<void> {
        await fetchJsonWithFallback(path, init, { expectJson: false });
    }

    async searchCustomers(query: string): Promise<CRMCustomer[]> {
        return this.requestJson<CRMCustomer[]>(`/api/crm/customers?q=${encodeURIComponent(query)}`);
    }

    async getCustomer(id: string): Promise<CRMCustomer | null> {
        try {
            return await this.requestJson<CRMCustomer>(`/api/crm/customers/${id}`);
        } catch (error) {
            if (isNotFound(error)) return null;
            throw error;
        }
    }

    async addCustomer(customer: Omit<CRMCustomer, "id" | "createdAt" | "usageCount">): Promise<CRMCustomer> {
        return this.requestJson<CRMCustomer>("/api/crm/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(customer),
        });
    }

    async updateCustomerUsage(id: string): Promise<void> {
        await this.requestWithoutBody(`/api/crm/customers/${id}/usage`, {
            method: "POST",
        });
    }

    async searchVehicles(query: string): Promise<CRMVehicle[]> {
        return this.requestJson<CRMVehicle[]>(`/api/crm/vehicles?q=${encodeURIComponent(query)}`);
    }

    async getVehicle(plateOrVin: string): Promise<CRMVehicle | null> {
        try {
            return await this.requestJson<CRMVehicle>(`/api/crm/vehicles/${encodeURIComponent(plateOrVin)}`);
        } catch (error) {
            if (isNotFound(error)) return null;
            throw error;
        }
    }

    async addVehicle(vehicle: Omit<CRMVehicle, "id" | "createdAt" | "usageCount">): Promise<CRMVehicle> {
        return this.requestJson<CRMVehicle>("/api/crm/vehicles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(vehicle),
        });
    }

    async updateVehicleUsage(id: string): Promise<void> {
        await this.requestWithoutBody(`/api/crm/vehicles/${id}/usage`, {
            method: "POST",
        });
    }

    async checkHealth(): Promise<CRMHealthResult> {
        return probeApiHealth();
    }

    async getVehicleProfile(plateOrVin: string): Promise<VehicleProfile | null> {
        try {
            const data = await this.requestJson<any>(`/api/crm/by-vehicle?plate=${encodeURIComponent(plateOrVin)}`);
            if (!data || Array.isArray(data) || !data.vehicle_policy_uid) return null;

            // 转换 snake_case 到 camelCase
            return {
                vehiclePolicyUid: data.vehicle_policy_uid,
                plate: data.plate,
                vin: data.vin,
                currentStatus: data.current_status || "ACTIVE",
                lastContactTime: data.last_contact_time,
                contacts: (data.contacts || []).map((c: any) => ({
                    contactId: c.contact_id,
                    roleType: c.role_type,
                    name: c.name,
                    idType: c.id_type,
                    idNo: c.id_no,
                    phone: c.phone,
                })),
                flags: (data.flags || []).map((f: any) => ({
                    flagId: f.flag_id,
                    flagType: f.flag_type,
                    flagNote: f.flag_note,
                    isActive: f.is_active === 1,
                    createdAt: f.created_at,
                    createdBy: f.created_by,
                })),
            };
        } catch (error) {
            if (isNotFound(error)) return null;
            throw error;
        }
    }

    async getTimeline(vehicleUid: string): Promise<TimelineEvent[]> {
        return this.requestJson<TimelineEvent[]>(`/api/crm/timeline?vehicle_policy_uid=${vehicleUid}`);
    }

    async getInteractions(vehicleUid: string): Promise<Interaction[]> {
        return this.requestJson<Interaction[]>(`/api/crm/vehicle/${vehicleUid}/interactions`);
    }

    async addInteraction(interaction: InteractionInput): Promise<Interaction> {
        return this.requestJson<Interaction>("/api/crm/interaction/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                vehicle_policy_uid: interaction.vehiclePolicyUid,
                contact_method: interaction.contactMethod,
                topic: interaction.topic,
                result: interaction.result,
                follow_up_status: interaction.followUpStatus,
                operator_name: interaction.operatorName,
            }),
        });
    }

    async getFlags(vehicleUid: string): Promise<Flag[]> {
        return this.requestJson<Flag[]>(`/api/crm/vehicle/${vehicleUid}/flags`);
    }

    async addFlag(flag: FlagInput): Promise<Flag> {
        return this.requestJson<Flag>("/api/crm/flag/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                vehicle_policy_uid: flag.vehiclePolicyUid,
                flag_type: flag.flagType,
                flag_note: flag.flagNote,
                created_by: flag.createdBy,
            }),
        });
    }

    // 批量添加车辆（用于 CSV 导入）
    async bulkAddVehicles(vehicles: Omit<CRMVehicle, "id" | "createdAt" | "usageCount">[]): Promise<CRMVehicle[]> {
        try {
            return await this.requestJson<CRMVehicle[]>("/api/crm/vehicles/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vehicles }),
            });
        } catch (error) {
            const apiError = toApiError(error);

            if (apiError.kind === "network" || apiError.kind === "timeout") {
                throw new ApiRequestError({
                    kind: apiError.kind,
                    message: "API 不可达，请检查后端服务与域名配置",
                    url: apiError.url,
                    cause: apiError,
                });
            }

            if (apiError.kind === "parse") {
                throw new ApiRequestError({
                    kind: "parse",
                    message: "接口响应格式异常",
                    url: apiError.url,
                    responseText: apiError.responseText,
                    cause: apiError,
                });
            }

            throw apiError;
        }
    }

    // 获取所有车辆（用于 CSV 导出）
    async getAllVehicles(): Promise<CRMVehicle[]> {
        return this.requestJson<CRMVehicle[]>("/api/crm/vehicles");
    }

    // 获取所有客户（用于 CSV 导出）
    async getAllCustomers(): Promise<CRMCustomer[]> {
        return this.requestJson<CRMCustomer[]>("/api/crm/customers");
    }

    // 工具方法：获取当前模式（始终为 database）
    getCurrentMode(): "database" {
        return "database";
    }
}

// 导出单例 - 仅使用数据库源
export const crmDataSource = new DatabaseSource();
