/**
 * CRM 数据导入导出工具
 * 支持 CSV 格式的车辆数据导入导出
 */

import type { CRMVehicle, CRMCustomer } from "./crmStorage";
import { getAllVehicles, getAllCustomers } from "./crmStorage";

// ==================== 导出功能 ====================

/**
 * 将车辆数据导出为 CSV 格式
 */
export const exportVehiclesToCSV = (): string => {
    const vehicles = getAllVehicles();

    // CSV 表头
    const headers = [
        "ID",
        "昵称",
        "车牌号",
        "车架号(VIN)",
        "发动机号",
        "品牌型号",
        "车辆类型",
        "使用性质",
        "注册日期",
        "发证日期",
        "整备质量(kg)",
        "核定载质量(kg)",
        "座位数",
        "能源类型",
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
export const exportCustomersToCSV = (): string => {
    const customers = getAllCustomers();

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
export const downloadVehiclesCSV = (): void => {
    const csv = exportVehiclesToCSV();
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(csv, `CRM车辆档案_${date}.csv`);
};

/**
 * 导出客户数据为 CSV 文件
 */
export const downloadCustomersCSV = (): void => {
    const csv = exportCustomersToCSV();
    const date = new Date().toISOString().split("T")[0];
    downloadCSV(csv, `CRM客户档案_${date}.csv`);
};

// ==================== 导入功能 ====================

interface ImportResult {
    success: boolean;
    imported: number;
    errors: string[];
}

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
 * 从 CSV 导入车辆数据
 */
export const importVehiclesFromCSV = (csvContent: string): ImportResult => {
    const result: ImportResult = { success: true, imported: 0, errors: [] };

    try {
        const rows = parseCSV(csvContent);
        if (rows.length < 2) {
            return { success: false, imported: 0, errors: ["CSV 文件为空或格式错误"] };
        }

        const headers = rows[0];
        const dataRows = rows.slice(1);

        // 查找列索引
        const findIndex = (name: string) => headers.findIndex(h => h.includes(name));

        const plateIdx = findIndex("车牌");
        const vinIdx = findIndex("VIN") !== -1 ? findIndex("VIN") : findIndex("车架");
        const engineIdx = findIndex("发动机");
        const brandIdx = findIndex("品牌");
        const typeIdx = findIndex("车辆类型");
        const natureIdx = findIndex("使用性质");
        const registerIdx = findIndex("注册");
        const issueIdx = findIndex("发证");
        const weightIdx = findIndex("整备");
        const loadIdx = findIndex("载质量");
        const seatsIdx = findIndex("座位");
        const energyIdx = findIndex("能源");

        if (plateIdx === -1 || vinIdx === -1) {
            return { success: false, imported: 0, errors: ["CSV 缺少必要的列：车牌号、车架号"] };
        }

        const vehicles: CRMVehicle[] = [];

        dataRows.forEach((row, index) => {
            try {
                if (!row[plateIdx] || !row[vinIdx]) {
                    result.errors.push(`第 ${index + 2} 行：车牌号或车架号为空`);
                    return;
                }

                const vehicle: CRMVehicle = {
                    id: `vehicle_import_${Date.now()}_${index}`,
                    nickname: row[plateIdx],
                    plate: row[plateIdx],
                    vin: row[vinIdx],
                    engineNo: engineIdx !== -1 ? row[engineIdx] || "" : "",
                    brand: brandIdx !== -1 ? row[brandIdx] || "" : "",
                    vehicleType: typeIdx !== -1 ? row[typeIdx] || "客车" : "客车",
                    useNature: natureIdx !== -1 ? row[natureIdx] || "家庭自用" : "家庭自用",
                    registerDate: registerIdx !== -1 ? row[registerIdx] || "" : "",
                    issueDate: issueIdx !== -1 ? row[issueIdx] || "" : "",
                    curbWeight: weightIdx !== -1 ? row[weightIdx] || "" : "",
                    approvedLoad: loadIdx !== -1 ? row[loadIdx] || "" : "",
                    seats: seatsIdx !== -1 ? row[seatsIdx] || "5" : "5",
                    energyType: energyIdx !== -1 && row[energyIdx]?.includes("新能源") ? "NEV" : "FUEL",
                    createdAt: new Date().toISOString(),
                    usageCount: 0,
                    isFavorite: false,
                    tags: ["导入数据"]
                };

                vehicles.push(vehicle);
                result.imported++;
            } catch (e: any) {
                result.errors.push(`第 ${index + 2} 行解析失败：${e.message}`);
            }
        });

        // 合并到现有数据
        if (vehicles.length > 0) {
            const existing = getAllVehicles();
            const merged = [...existing, ...vehicles];
            localStorage.setItem("crm_vehicles", JSON.stringify(merged));
        }

        result.success = result.errors.length === 0;
    } catch (e: any) {
        result.success = false;
        result.errors.push(`解析失败：${e.message}`);
    }

    return result;
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

    reader.onload = (e) => {
        const content = e.target?.result as string;

        if (type === "vehicles") {
            const result = importVehiclesFromCSV(content);
            callback(result);
        } else {
            // TODO: 实现客户导入
            callback({ success: false, imported: 0, errors: ["客户导入功能开发中"] });
        }
    };

    reader.onerror = () => {
        callback({ success: false, imported: 0, errors: ["文件读取失败"] });
    };

    reader.readAsText(file, "UTF-8");
};
