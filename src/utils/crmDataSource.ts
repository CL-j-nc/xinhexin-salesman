import type { CRMCustomer, CRMVehicle } from "./crmStorage";
import {
    getAllCustomers,
    getAllVehicles,
    searchCustomers as searchLocalCustomers,
    searchVehicles as searchLocalVehicles,
    getCustomerById,
    getVehicleById,
    addCustomer as addLocalCustomer,
    addVehicle as addLocalVehicle,
    incrementCustomerUsage,
    incrementVehicleUsage,
} from "./crmStorage";

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

// 数据库数据源实现
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
}

// localStorage 数据源实现
class LocalStorageSource implements CRMDataSource {
    async searchCustomers(query: string): Promise<CRMCustomer[]> {
        return Promise.resolve(searchLocalCustomers(query));
    }

    async getCustomer(id: string): Promise<CRMCustomer | null> {
        return Promise.resolve(getCustomerById(id));
    }

    async addCustomer(customer: Omit<CRMCustomer, "id" | "createdAt" | "usageCount">): Promise<CRMCustomer> {
        return Promise.resolve(addLocalCustomer(customer));
    }

    async updateCustomerUsage(id: string): Promise<void> {
        incrementCustomerUsage(id);
        return Promise.resolve();
    }

    async searchVehicles(query: string): Promise<CRMVehicle[]> {
        return Promise.resolve(searchLocalVehicles(query));
    }

    async getVehicle(plateOrVin: string): Promise<CRMVehicle | null> {
        const vehicles = getAllVehicles();
        return Promise.resolve(
            vehicles.find(v => v.plate === plateOrVin || v.vin === plateOrVin) || null
        );
    }
    async addVehicle(vehicle: Omit<CRMVehicle, "id" | "createdAt" | "usageCount">): Promise<CRMVehicle> {
        return Promise.resolve(addLocalVehicle(vehicle));
    }

    async updateVehicleUsage(id: string): Promise<void> {
        incrementVehicleUsage(id);
        return Promise.resolve();
    }

    // 生产功能在 localStorage 模式下返回空数据或模拟数据
    async getVehicleProfile(plateOrVin: string): Promise<VehicleProfile | null> {
        const vehicles = getAllVehicles();
        const vehicle = vehicles.find(v => v.plate === plateOrVin || v.vin === plateOrVin);
        if (!vehicle) return null;

        // 模拟车辆档案
        return {
            vehiclePolicyUid: `mock_uid_${vehicle.plate}`,
            plate: vehicle.plate,
            vin: vehicle.vin,
            currentStatus: "测试数据",
            contacts: [],
            flags: [],
        };
    }

    async getTimeline(vehicleUid: string): Promise<TimelineEvent[]> {
        // localStorage 模式下返回空时间轴
        return Promise.resolve([]);
    }

    async getInteractions(vehicleUid: string): Promise<Interaction[]> {
        // localStorage 模式下返回空沟通记录
        return Promise.resolve([]);
    }

    async addInteraction(interaction: InteractionInput): Promise<Interaction> {
        // localStorage 模式下模拟添加，但不持久化
        return Promise.resolve({
            interactionId: `mock_${Date.now()}`,
            contactMethod: interaction.contactMethod,
            topic: interaction.topic,
            result: interaction.result,
            followUpStatus: interaction.followUpStatus,
            interactionTime: new Date().toISOString(),
            operatorName: interaction.operatorName,
        });
    }

    async getFlags(vehicleUid: string): Promise<Flag[]> {
        // localStorage 模式下返回空标记
        return Promise.resolve([]);
    }

    async addFlag(flag: FlagInput): Promise<Flag> {
        // localStorage 模式下模拟添加，但不持久化
        return Promise.resolve({
            flagId: `mock_${Date.now()}`,
            flagType: flag.flagType,
            flagNote: flag.flagNote,
            isActive: true,
            createdAt: new Date().toISOString(),
            createdBy: flag.createdBy,
        });
    }
}

// 混合数据源（智能切换）
class HybridDataSource implements CRMDataSource {
    private dbSource: DatabaseSource;
    private localSource: LocalStorageSource;
    private useDatabaseMode: boolean = false;
    private backendDetected: boolean = false;

    constructor() {
        this.dbSource = new DatabaseSource();
        this.localSource = new LocalStorageSource();
        this.detectBackend();
    }

    private async detectBackend() {
        try {
            // 尝试访问健康检查端点
            const response = await fetch("/api/health", { method: "HEAD" });
            if (response.ok) {
                this.useDatabaseMode = true;
                this.backendDetected = true;
                console.log("✅ CRM: Backend detected, using database mode");
            } else {
                this.fallbackToLocal();
            }
        } catch (error) {
            this.fallbackToLocal();
        }
    }

    private fallbackToLocal() {
        this.useDatabaseMode = false;
        this.backendDetected = false;
        console.log("📦 CRM: Backend unavailable, using localStorage mode");
    }

    private async tryDatabase<T>(
        dbOperation: () => Promise<T>,
        localFallback: () => Promise<T>
    ): Promise<T> {
        if (!this.backendDetected) {
            return localFallback();
        }

        try {
            return await dbOperation();
        } catch (error) {
            console.warn("Database operation failed, falling back to localStorage:", error);
            this.fallbackToLocal();
            return localFallback();
        }
    }

    async searchCustomers(query: string): Promise<CRMCustomer[]> {
        return this.tryDatabase(
            () => this.dbSource.searchCustomers(query),
            () => this.localSource.searchCustomers(query)
        );
    }

    async getCustomer(id: string): Promise<CRMCustomer | null> {
        return this.tryDatabase(
            () => this.dbSource.getCustomer(id),
            () => this.localSource.getCustomer(id)
        );
    }

    async addCustomer(customer: Omit<CRMCustomer, "id" | "createdAt" | "usageCount">): Promise<CRMCustomer> {
        return this.tryDatabase(
            () => this.dbSource.addCustomer(customer),
            () => this.localSource.addCustomer(customer)
        );
    }

    async updateCustomerUsage(id: string): Promise<void> {
        return this.tryDatabase(
            () => this.dbSource.updateCustomerUsage(id),
            () => this.localSource.updateCustomerUsage(id)
        );
    }

    async searchVehicles(query: string): Promise<CRMVehicle[]> {
        return this.tryDatabase(
            () => this.dbSource.searchVehicles(query),
            () => this.localSource.searchVehicles(query)
        );
    }

    async getVehicle(plateOrVin: string): Promise<CRMVehicle | null> {
        return this.tryDatabase(
            () => this.dbSource.getVehicle(plateOrVin),
            () => this.localSource.getVehicle(plateOrVin)
        );
    }

    async addVehicle(vehicle: Omit<CRMVehicle, "id" | "createdAt" | "usageCount">): Promise<CRMVehicle> {
        return this.tryDatabase(
            () => this.dbSource.addVehicle(vehicle),
            () => this.localSource.addVehicle(vehicle)
        );
    }

    async updateVehicleUsage(id: string): Promise<void> {
        return this.tryDatabase(
            () => this.dbSource.updateVehicleUsage(id),
            () => this.localSource.updateVehicleUsage(id)
        );
    }

    async getVehicleProfile(plateOrVin: string): Promise<VehicleProfile | null> {
        return this.tryDatabase(
            () => this.dbSource.getVehicleProfile(plateOrVin),
            () => this.localSource.getVehicleProfile(plateOrVin)
        );
    }

    async getTimeline(vehicleUid: string): Promise<TimelineEvent[]> {
        return this.tryDatabase(
            () => this.dbSource.getTimeline(vehicleUid),
            () => this.localSource.getTimeline(vehicleUid)
        );
    }

    async getInteractions(vehicleUid: string): Promise<Interaction[]> {
        return this.tryDatabase(
            () => this.dbSource.getInteractions(vehicleUid),
            () => this.localSource.getInteractions(vehicleUid)
        );
    }

    async addInteraction(interaction: InteractionInput): Promise<Interaction> {
        return this.tryDatabase(
            () => this.dbSource.addInteraction(interaction),
            () => this.localSource.addInteraction(interaction)
        );
    }

    async getFlags(vehicleUid: string): Promise<Flag[]> {
        return this.tryDatabase(
            () => this.dbSource.getFlags(vehicleUid),
            () => this.localSource.getFlags(vehicleUid)
        );
    }

    async addFlag(flag: FlagInput): Promise<Flag> {
        return this.tryDatabase(
            () => this.dbSource.addFlag(flag),
            () => this.localSource.addFlag(flag)
        );
    }

    // 工具方法：获取当前模式
    getCurrentMode(): "database" | "localStorage" {
        return this.backendDetected ? "database" : "localStorage";
    }
}

// 导出单例
export const crmDataSource = new HybridDataSource();
