import type { CRMCustomer, CRMVehicle } from "./crmStorage";

// API 基础地址 - 从环境变量读取，或使用默认值
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://xinhexin-api.chinalife-shiexinhexin.workers.dev";

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
    private baseUrl: string;

    constructor(baseUrl: string = "") {
        this.baseUrl = baseUrl;
    }

    async searchCustomers(query: string): Promise<CRMCustomer[]> {
        const response = await fetch(`${this.baseUrl}/api/crm/customers?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Database query failed");
        return response.json();
    }

    async getCustomer(id: string): Promise<CRMCustomer | null> {
        const response = await fetch(`${this.baseUrl}/api/crm/customers/${id}`);
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Database query failed");
        return response.json();
    }

    async addCustomer(customer: Omit<CRMCustomer, "id" | "createdAt" | "usageCount">): Promise<CRMCustomer> {
        const response = await fetch(`${this.baseUrl}/api/crm/customers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(customer),
        });
        if (!response.ok) throw new Error("Failed to add customer");
        return response.json();
    }

    async updateCustomerUsage(id: string): Promise<void> {
        await fetch(`${this.baseUrl}/api/crm/customers/${id}/usage`, {
            method: "POST",
        });
    }

    async searchVehicles(query: string): Promise<CRMVehicle[]> {
        const response = await fetch(`${this.baseUrl}/api/crm/vehicles?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Database query failed");
        return response.json();
    }

    async getVehicle(plateOrVin: string): Promise<CRMVehicle | null> {
        const response = await fetch(`${this.baseUrl}/api/crm/vehicles/${encodeURIComponent(plateOrVin)}`);
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Database query failed");
        return response.json();
    }

    async addVehicle(vehicle: Omit<CRMVehicle, "id" | "createdAt" | "usageCount">): Promise<CRMVehicle> {
        const response = await fetch(`${this.baseUrl}/api/crm/vehicles`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(vehicle),
        });
        if (!response.ok) throw new Error("Failed to add vehicle");
        return response.json();
    }

    async updateVehicleUsage(id: string): Promise<void> {
        await fetch(`${this.baseUrl}/api/crm/vehicles/${id}/usage`, {
            method: "POST",
        });
    }

    async getVehicleProfile(plateOrVin: string): Promise<VehicleProfile | null> {
        // 使用规范路径 /api/crm/by-vehicle
        const response = await fetch(`${this.baseUrl}/api/crm/by-vehicle?plate=${encodeURIComponent(plateOrVin)}`);
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Database query failed");
        const data = await response.json();
        if (!data || !data.vehicle_policy_uid) return null;
        // 转换snake_case到camelCase
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
                phone: c.phone
            })),
            flags: (data.flags || []).map((f: any) => ({
                flagId: f.flag_id,
                flagType: f.flag_type,
                flagNote: f.flag_note,
                isActive: f.is_active === 1,
                createdAt: f.created_at,
                createdBy: f.created_by
            }))
        };
    }

    async getTimeline(vehicleUid: string): Promise<TimelineEvent[]> {
        // 使用规范路径 /api/crm/timeline
        const response = await fetch(`${this.baseUrl}/api/crm/timeline?vehicle_policy_uid=${vehicleUid}`);
        if (!response.ok) throw new Error("Database query failed");
        return response.json();
    }

    async getInteractions(vehicleUid: string): Promise<Interaction[]> {
        const response = await fetch(`${this.baseUrl}/api/crm/vehicle/${vehicleUid}/interactions`);
        if (!response.ok) throw new Error("Database query failed");
        return response.json();
    }

    async addInteraction(interaction: InteractionInput): Promise<Interaction> {
        // 使用规范路径 /api/crm/interaction/add
        const response = await fetch(`${this.baseUrl}/api/crm/interaction/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                vehicle_policy_uid: interaction.vehiclePolicyUid,
                contact_method: interaction.contactMethod,
                topic: interaction.topic,
                result: interaction.result,
                follow_up_status: interaction.followUpStatus,
                operator_name: interaction.operatorName
            }),
        });
        if (!response.ok) throw new Error("Failed to add interaction");
        return response.json();
    }

    async getFlags(vehicleUid: string): Promise<Flag[]> {
        const response = await fetch(`${this.baseUrl}/api/crm/vehicle/${vehicleUid}/flags`);
        if (!response.ok) throw new Error("Database query failed");
        return response.json();
    }

    async addFlag(flag: FlagInput): Promise<Flag> {
        // 使用规范路径 /api/crm/flag/add
        const response = await fetch(`${this.baseUrl}/api/crm/flag/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                vehicle_policy_uid: flag.vehiclePolicyUid,
                flag_type: flag.flagType,
                flag_note: flag.flagNote,
                created_by: flag.createdBy
            }),
        });
        if (!response.ok) throw new Error("Failed to add flag");
        return response.json();
    }

    // 批量添加车辆（用于CSV导入）
    async bulkAddVehicles(vehicles: Omit<CRMVehicle, "id" | "createdAt" | "usageCount">[]): Promise<CRMVehicle[]> {
        const response = await fetch(`${this.baseUrl}/api/crm/vehicles/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vehicles }),
        });
        if (!response.ok) throw new Error("Failed to bulk add vehicles");
        return response.json();
    }

    // 获取所有车辆（用于CSV导出）
    async getAllVehicles(): Promise<CRMVehicle[]> {
        const response = await fetch(`${this.baseUrl}/api/crm/vehicles`);
        if (!response.ok) throw new Error("Database query failed");
        return response.json();
    }

    // 获取所有客户（用于CSV导出）
    async getAllCustomers(): Promise<CRMCustomer[]> {
        const response = await fetch(`${this.baseUrl}/api/crm/customers`);
        if (!response.ok) throw new Error("Database query failed");
        return response.json();
    }

    // 工具方法：获取当前模式（始终为database）
    getCurrentMode(): "database" {
        return "database";
    }
}

// 导出单例 - 仅使用数据库源
export const crmDataSource = new DatabaseSource(API_BASE);
