/**
 * CRM 客户数据管理系统 - 类型定义
 * 
 * ⚠️ 注意：本文件仅包含类型定义
 * 所有数据存取必须通过 crmDataSource.ts 使用 API
 * 不允许使用 localStorage / sessionStorage
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

/**
 * @deprecated 使用 crmDataSource.ts 的 API 方法替代
 * 以下函数已移除，保留此注释仅作提醒
 * 
 * 如需操作 CRM 数据，请使用：
 * import { crmDataSource } from "./crmDataSource";
 * 
 * 示例:
 * - 搜索客户: await crmDataSource.searchCustomers(query)
 * - 添加车辆: await crmDataSource.addVehicle(vehicle)
 * - 获取车辆档案: await crmDataSource.getVehicleProfile(plate)
 */
