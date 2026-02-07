/**
 * CRM 数据导入导出工具
 * 支持 CSV 格式的车辆数据导入导出
 * 所有数据通过 API 存取，不使用 localStorage
 */

import type { CRMVehicle, CRMCustomer } from "./crmStorage";
import { crmDataSource } from "./crmDataSource";
import { ApiRequestError, getApiBases } from "./apiClient";
import {
    validateAndMapColumns,
    vehicleFieldMappings,
    ownerFieldMappings,
    transformFieldValue
} from "./fieldMapping";

// ==================== 导出功能 ====================

/**
 * 将车辆数据导出为 CSV 格式
 * 使用统一的字段映射确保列名一致
 */
export const exportVehiclesToCSV = async (): Promise<string> => {
    const vehicles = await crmDataSource.getAllVehicles();

    // 使用统一的字段映射获取 CSV 表头
    const headers = [
        "ID",
        "昵称",
        vehicleFieldMappings.plate.label,
        vehicleFieldMappings.vin.label,
        vehicleFieldMappings.engineNo.label,
        vehicleFieldMappings.brand.label,
        vehicleFieldMappings.vehicleType.label,
        vehicleFieldMappings.useNature.label,
        vehicleFieldMappings.registerDate.label,
        vehicleFieldMappings.issueDate.label,
        vehicleFieldMappings.curbWeight.label,
        vehicleFieldMappings.approvedLoad.label,
        vehicleFieldMappings.seats.label,
        vehicleFieldMappings.energyType.label,
        "创建时间",
        "使用次数",
        "是否收藏",
        "标签"
    ];

    // 转换数据行
    const rows = vehicles.map(v => [
        v.id,
        v.nickname || "",
        v.plate,
        v.vin,
        v.engineNo,
        v.brand,
        v.vehicleType,
        v.useNature,
        v.registerDate,
        v.issueDate,
        v.curbWeight,
        v.approvedLoad,
        v.seats,
        v.energyType,
        v.createdAt,
        v.usageCount.toString(),
        v.isFavorite ? "是" : "否",
        v.tags.join(";")
    ]);

    // 组装 CSV
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    return csvContent;
};

/**
 * 将客户数据导出为 CSV 格式
 */
export const exportCustomersToCSV = async (): Promise<string> => {
    const customers = await crmDataSource.getAllCustomers();

    const headers = [
        "ID",
        "姓名",
        "昵称",
        "证件类型",
        "证件号码",
        "手机号",
        "地址",
        "性别",
        "国籍",
        "身份类型",
        "创建时间",
        "使用次数",
        "是否收藏",
        "标签"
    ];

    const rows = customers.map(c => [
        c.id,
        c.name,
        c.nickname || "",
        c.idType,
        c.idCard,
        c.mobile,
        c.address,
        c.gender === "male" ? "男" : "女",
        c.nationality,
        c.identityType === "individual" ? "个人" : "企业",
        c.createdAt,
        c.usageCount.toString(),
        c.isFavorite ? "是" : "否",
        c.tags.join(";")
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    return csvContent;
};

/**
 * 下载 CSV 文件
 */
export const downloadCSV = (content: string, filename: string): void => {
    // 添加 BOM 以支持中文在 Excel 中正确显示
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
};

/**
 * 导出车辆数据为 CSV 文件
 */
export const downloadVehiclesCSV = async (): Promise<void> => {
    const csv = await exportVehiclesToCSV();
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(csv, `CRM车辆档案_${date}.csv`);
};

/**
 * 导出客户数据为 CSV 文件
 */
export const downloadCustomersCSV = async (): Promise<void> => {
    const csv = await exportCustomersToCSV();
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(csv, `CRM客户档案_${date}.csv`);
};

/**
 * 生成 CRM 车辆导入样表（CSV）
 * 导入前可先下载该模板，按列填充后再导入。
 */
export const exportVehiclesImportTemplateCSV = (): string => {
    const headers = [
        "车牌号",
        "车架号",
        "发动机号",
        "品牌型号",
        "车辆类型",
        "使用性质",
        "注册日期",
        "发证日期",
        "整备质量",
        "核定载质量",
        "座位数",
        "能源类型",
        "车主",
        "手机号",
        "身份证"
    ];

    const sampleRow = [
        "粤B12345",
        "LNBSCQDK2GX123456",
        "E1234567",
        "比亚迪 秦PLUS DM-i",
        "客车",
        "家庭自用",
        "2023-05-18",
        "2023-05-20",
        "1460",
        "375",
        "5",
        "新能源",
        "张三",
        "13800001234",
        "440101199001010011"
    ];

    return [
        headers.join(","),
        sampleRow.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    ].join("\n");
};

/**
 * 下载 CRM 车辆导入样表（CSV）
 */
export const downloadVehiclesImportTemplateCSV = (): void => {
    const content = exportVehiclesImportTemplateCSV();
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(content, `CRM车辆导入样表_${date}.csv`);
};

// ==================== 导入功能 ====================

export interface ImportResult {
    success: boolean;
    imported: number;
    errors: string[];
    diagnostics?: string[];
}

const getImportedCount = (payload: unknown): number => {
    if (Array.isArray(payload)) return payload.length;
    if (payload && typeof payload === "object") {
        const imported = (payload as { imported?: unknown }).imported;
        if (typeof imported === "number" && imported >= 0) return imported;
    }
    return 0;
};

const buildHealthCheckFailure = (reason?: string): ImportResult => ({
    success: false,
    imported: 0,
    errors: [
        `API 健康检查失败：${reason || "未检测到可用后端服务"}`,
        "请检查后端 Worker 是否在线，或确认前端环境变量 VITE_API_BASE_URL 是否正确。",
    ],
    diagnostics: [
        `候选 API 域名: ${getApiBases().join(" -> ")}`,
    ],
});

const mapImportApiError = (error: unknown): { message: string; diagnostics: string[] } => {
    if (error instanceof ApiRequestError) {
        const diagnostics: string[] = [];
        if (error.url) diagnostics.push(`请求地址: ${error.url}`);
        if (typeof error.status === "number") diagnostics.push(`HTTP 状态: ${error.status}`);
        if (error.responseText) diagnostics.push(`响应片段: ${error.responseText.slice(0, 200)}`);

        if (error.kind === "network" || error.kind === "timeout") {
            return {
                message: `API 不可达：${error.message}`,
                diagnostics: diagnostics.length > 0 ? diagnostics : [`候选 API 域名: ${getApiBases().join(" -> ")}`],
            };
        }
        if (error.kind === "parse") {
            return {
                message: "接口响应格式异常",
                diagnostics,
            };
        }
        return {
            message: error.message || "请求失败",
            diagnostics,
        };
    }

    return {
        message: error instanceof Error ? error.message : "未知错误",
        diagnostics: [],
    };
};

const ensureApiReady = async (): Promise<ImportResult | null> => {
    const health = await crmDataSource.checkHealth();
    if (health.ok) return null;
    return buildHealthCheckFailure(health.reason);
};

/**
 * 解析 CSV 内容
 */
const parseCSV = (content: string): string[][] => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());

    return lines.map(line => {
        const cells: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === "," && !inQuotes) {
                cells.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        cells.push(current.trim());

        return cells;
    });
};

/**
 * 从 CSV 导入车辆数据（通过 API 存储到 D1）
 */
export const importVehiclesFromCSV = async (csvContent: string): Promise<ImportResult> => {
    const result: ImportResult = { success: true, imported: 0, errors: [] };

    try {
        const healthError = await ensureApiReady();
        if (healthError) return healthError;

        const rows = parseCSV(csvContent);
        if (rows.length < 2) {
            return { success: false, imported: 0, errors: ["CSV 文件为空或格式错误"] };
        }

        const headers = rows[0];
        const dataRows = rows.slice(1);

        // 使用统一的字段映射进行验证和列索引查询
        const { success: isValid, mapping, errors: mappingErrors } = validateAndMapColumns(headers);

        if (!isValid) {
            return {
                success: false,
                imported: 0,
                errors: [
                    "CSV 列名识别失败：",
                    ...mappingErrors,
                    "",
                    "当前 CSV 列名: " + headers.join(", ")
                ]
            };
        }

        const vehiclesToImport: Omit<CRMVehicle, "id" | "createdAt" | "usageCount">[] = [];

        dataRows.forEach((row, index) => {
            try {
                // 检查必需字段
                const plateIdx = mapping["plate"];
                const vinIdx = mapping["vin"];

                if (plateIdx === undefined || vinIdx === undefined || !row[plateIdx] || !row[vinIdx]) {
                    result.errors.push(`第 ${index + 2} 行：车牌号或车架号为空`);
                    return;
                }

                // 构建车辆对象
                const vehicle: Omit<CRMVehicle, "id" | "createdAt" | "usageCount"> = {
                    nickname: row[plateIdx],
                    plate: row[plateIdx],
                    vin: row[vinIdx],
                    engineNo: mapping["engineNo"] !== undefined ? (row[mapping["engineNo"]] || "") : "",
                    brand: mapping["brand"] !== undefined ? (row[mapping["brand"]] || "") : "",
                    vehicleType: mapping["vehicleType"] !== undefined ? (row[mapping["vehicleType"]] || "客车") : "客车",
                    useNature: mapping["useNature"] !== undefined ? (row[mapping["useNature"]] || "家庭自用") : "家庭自用",
                    registerDate: mapping["registerDate"] !== undefined ? (row[mapping["registerDate"]] || "") : "",
                    issueDate: mapping["issueDate"] !== undefined ? (row[mapping["issueDate"]] || "") : "",
                    curbWeight: mapping["curbWeight"] !== undefined ? (row[mapping["curbWeight"]] || "") : "",
                    approvedLoad: mapping["approvedLoad"] !== undefined ? (row[mapping["approvedLoad"]] || "") : "",
                    seats: mapping["seats"] !== undefined ? (row[mapping["seats"]] || "5") : "5",
                    energyType: mapping["energyType"] !== undefined
                        ? transformFieldValue("energyType", row[mapping["energyType"]])
                        : "FUEL",
                    isFavorite: false,
                    tags: ["导入数据"]
                };

                // 如果有车主信息，添加到 policyInfo
                const ownerNameIdx = mapping["ownerName"];
                if (ownerNameIdx !== undefined && row[ownerNameIdx]) {
                    vehicle.policyInfo = {
                        ownerName: row[ownerNameIdx],
                        ownerPhone: mapping["ownerPhone"] !== undefined ? (row[mapping["ownerPhone"]] || "") : "",
                        ownerIdCard: mapping["ownerIdCard"] !== undefined ? (row[mapping["ownerIdCard"]] || "") : "",
                        // 默认为空的值
                        policyNo: "",
                        coverages: [],
                        applyTime: "",
                        status: "APPLIED"
                    };
                }

                vehiclesToImport.push(vehicle);
            } catch (e: any) {
                result.errors.push(`第 ${index + 2} 行解析失败：${e.message}`);
            }
        });

        // 批量通过 API 添加到 D1
        if (vehiclesToImport.length > 0) {
            try {
                const imported = await crmDataSource.bulkAddVehicles(vehiclesToImport);
                result.imported = getImportedCount(imported);
            } catch (error) {
                const mapped = mapImportApiError(error);
                result.errors.push(`批量导入失败：${mapped.message}`);
                if (mapped.diagnostics.length > 0) {
                    result.diagnostics = mapped.diagnostics;
                }
                result.success = false;
            }
        }

        result.success = result.errors.length === 0;
    } catch (e: any) {
        result.success = false;
        result.errors.push(`解析失败：${e.message}`);
    }

    return result;
};

/**
 * 一键导入测试数据
 */
import { mockVehicles } from "./mockCRMData";

export const importTestVehicles = async (): Promise<ImportResult> => {
    try {
        const healthError = await ensureApiReady();
        if (healthError) return healthError;

        const imported = await crmDataSource.bulkAddVehicles(mockVehicles);
        const importedCount = getImportedCount(imported);
        return {
            success: true,
            imported: importedCount,
            errors: []
        };
    } catch (error) {
        const mapped = mapImportApiError(error);
        return {
            success: false,
            imported: 0,
            errors: [`测试数据导入失败: ${mapped.message}`],
            diagnostics: mapped.diagnostics
        };
    }
};

/**
 * 读取上传的文件并导入
 */
export const handleFileImport = (
    file: File,
    type: "vehicles" | "customers",
    callback: (result: ImportResult) => void
): void => {
    const reader = new FileReader();

    reader.onload = async (e) => {
        const content = e.target?.result as string;

        if (type === "vehicles") {
            const result = await importVehiclesFromCSV(content);
            callback(result);
        } else {
            // 提示用户必须包含在车辆信息中
            callback({ success: false, imported: 0, errors: ["注意：客户数据必须随车辆数据一起导入。请在车辆 CSV 中包含“车主姓名、电话”列。"] });
        }
    };

    reader.onerror = () => {
        callback({ success: false, imported: 0, errors: ["文件读取失败"] });
    };

    reader.readAsText(file, "UTF-8");
};
