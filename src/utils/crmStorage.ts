/**
 * CRM 客户数据管理系统 - 本地存储工具
 * 提供客户和车辆数据的增删改查功能
 */

export interface CRMCustomer {
    id: string;
    name: string;
    nickname?: string;
    idType: string;
    idCard: string;
    mobile: string;
    address: string;
    gender: "male" | "female";
    nationality: string;
    identityType: "individual" | "enterprise";

    // 企业相关
    principalName?: string;
    principalIdCard?: string;
    principalGender?: "male" | "female";
    principalAddress?: string;

    // 其他信息
    issueAuthority?: string;
    validPeriod?: string;
    detailAddress?: string;

    // 元数据
    createdAt: string;
    lastUsed?: string;
    usageCount: number;
    isFavorite: boolean;
    tags: string[];
}

export interface CRMVehicle {
    id: string;
    nickname: string;
    plate: string;
    vin: string;
    engineNo: string;
    brand: string;
    vehicleType: string;
    useNature: string;
    registerDate: string;
    issueDate: string;
    curbWeight: string;
    approvedLoad: string;
    seats: string;
    energyType: "FUEL" | "NEV";

    // 元数据
    createdAt: string;
    lastUsed?: string;
    usageCount: number;
    isFavorite: boolean;
    tags: string[];

    // 保单信息（可选）
    policyInfo?: {
        policyNo: string;
        coverages: {
            type: string;
            name: string;
            amount: number;
            premium: number;
        }[];
        applyTime: string;
        paymentTime?: string;
        status: "APPLIED" | "APPROVED" | "PAID" | "ISSUED" | "REJECTED";
        ownerName: string;
        ownerIdCard: string;
        ownerPhone: string;
    };
}

const CUSTOMERS_KEY = "crm_customers";
const VEHICLES_KEY = "crm_vehicles";

// ==================== 客户数据管理 ====================

export const getAllCustomers = (): CRMCustomer[] => {
    try {
        const data = localStorage.getItem(CUSTOMERS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to load customers:", error);
        return [];
    }
};

export const getCustomerById = (id: string): CRMCustomer | null => {
    const customers = getAllCustomers();
    return customers.find(c => c.id === id) || null;
};

export const addCustomer = (customer: Omit<CRMCustomer, "id" | "createdAt" | "usageCount">): CRMCustomer => {
    const customers = getAllCustomers();
    const newCustomer: CRMCustomer = {
        ...customer,
        id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        usageCount: 0,
    };

    customers.push(newCustomer);
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    return newCustomer;
};

export const updateCustomer = (id: string, updates: Partial<CRMCustomer>): boolean => {
    const customers = getAllCustomers();
    const index = customers.findIndex(c => c.id === id);

    if (index === -1) return false;

    customers[index] = { ...customers[index], ...updates };
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    return true;
};

export const deleteCustomer = (id: string): boolean => {
    const customers = getAllCustomers();
    const filtered = customers.filter(c => c.id !== id);

    if (filtered.length === customers.length) return false;

    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(filtered));
    return true;
};

export const incrementCustomerUsage = (id: string): void => {
    const customers = getAllCustomers();
    const customer = customers.find(c => c.id === id);

    if (customer) {
        customer.usageCount++;
        customer.lastUsed = new Date().toISOString();
        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    }
};

export const searchCustomers = (query: string): CRMCustomer[] => {
    const customers = getAllCustomers();
    const lowerQuery = query.toLowerCase();

    return customers.filter(c =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.mobile.includes(query) ||
        c.idCard.includes(query) ||
        (c.nickname && c.nickname.toLowerCase().includes(lowerQuery))
    );
};

export const getFrequentCustomers = (limit: number = 5): CRMCustomer[] => {
    const customers = getAllCustomers();
    return customers
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
};

export const getFavoriteCustomers = (): CRMCustomer[] => {
    const customers = getAllCustomers();
    return customers.filter(c => c.isFavorite);
};

export const getCustomersByTag = (tag: string): CRMCustomer[] => {
    const customers = getAllCustomers();
    return customers.filter(c => c.tags.includes(tag));
};

// ==================== 车辆数据管理 ====================

export const getAllVehicles = (): CRMVehicle[] => {
    try {
        const data = localStorage.getItem(VEHICLES_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to load vehicles:", error);
        return [];
    }
};

export const getVehicleById = (id: string): CRMVehicle | null => {
    const vehicles = getAllVehicles();
    return vehicles.find(v => v.id === id) || null;
};

export const addVehicle = (vehicle: Omit<CRMVehicle, "id" | "createdAt" | "usageCount">): CRMVehicle => {
    const vehicles = getAllVehicles();
    const newVehicle: CRMVehicle = {
        ...vehicle,
        id: `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        usageCount: 0,
    };

    vehicles.push(newVehicle);
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
    return newVehicle;
};

export const updateVehicle = (id: string, updates: Partial<CRMVehicle>): boolean => {
    const vehicles = getAllVehicles();
    const index = vehicles.findIndex(v => v.id === id);

    if (index === -1) return false;

    vehicles[index] = { ...vehicles[index], ...updates };
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
    return true;
};

export const deleteVehicle = (id: string): boolean => {
    const vehicles = getAllVehicles();
    const filtered = vehicles.filter(v => v.id !== id);

    if (filtered.length === vehicles.length) return false;

    localStorage.setItem(VEHICLES_KEY, JSON.stringify(filtered));
    return true;
};

export const incrementVehicleUsage = (id: string): void => {
    const vehicles = getAllVehicles();
    const vehicle = vehicles.find(v => v.id === id);

    if (vehicle) {
        vehicle.usageCount++;
        vehicle.lastUsed = new Date().toISOString();
        localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
    }
};

export const searchVehicles = (query: string): CRMVehicle[] => {
    const vehicles = getAllVehicles();
    const lowerQuery = query.toLowerCase();

    return vehicles.filter(v =>
        v.plate.toLowerCase().includes(lowerQuery) ||
        v.vin.toLowerCase().includes(lowerQuery) ||
        v.brand.toLowerCase().includes(lowerQuery) ||
        v.nickname.toLowerCase().includes(lowerQuery)
    );
};

export const getFrequentVehicles = (limit: number = 5): CRMVehicle[] => {
    const vehicles = getAllVehicles();
    return vehicles
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
};

export const getFavoriteVehicles = (): CRMVehicle[] => {
    const vehicles = getAllVehicles();
    return vehicles.filter(v => v.isFavorite);
};

export const getVehiclesByTag = (tag: string): CRMVehicle[] => {
    const vehicles = getAllVehicles();
    return vehicles.filter(v => v.tags.includes(tag));
};

// ==================== 初始化函数 ====================

export const initializeCRMData = (customers: CRMCustomer[], vehicles: CRMVehicle[]): void => {
    const existingCustomers = getAllCustomers();
    const existingVehicles = getAllVehicles();

    // 合并客户数据（按ID去重，新数据优先）
    const customerMap = new Map<string, CRMCustomer>();
    existingCustomers.forEach(c => customerMap.set(c.id, c));
    customers.forEach(c => customerMap.set(c.id, c)); // 新数据覆盖旧数据
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(Array.from(customerMap.values())));

    // 合并车辆数据（按ID去重，新数据优先）
    const vehicleMap = new Map<string, CRMVehicle>();
    existingVehicles.forEach(v => vehicleMap.set(v.id, v));
    vehicles.forEach(v => vehicleMap.set(v.id, v)); // 新数据覆盖旧数据
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(Array.from(vehicleMap.values())));
};

export const clearAllCRMData = (): void => {
    localStorage.removeItem(CUSTOMERS_KEY);
    localStorage.removeItem(VEHICLES_KEY);
};
