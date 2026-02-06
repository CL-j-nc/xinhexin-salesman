/**
 * CRM 字段映射配置
 * 将 CSV 中的各种列名格式统一映射到内部字段名
 * 支持中文/英文/蛇形式/驼峰式等多种格式
 * 
 * CSV 列名 → 内部字段名 → 中文含义
 */

export interface FieldMapping {
    // 内部字段名
    fieldName: string;
    // CSV 中可能出现的所有变体
    aliases: string[];
    // 中文含义
    label: string;
    // 数据转换函数（可选）
    transform?: (value: any) => any;
}

/**
 * 车辆信息字段映射
 */
export const vehicleFieldMappings: Record<string, FieldMapping> = {
    plate: {
        fieldName: "plate",
        aliases: ["车牌", "车牌号", "号牌号码", "plate", "plateno", "plateno."],
        label: "车牌号",
    },
    vin: {
        fieldName: "vin",
        aliases: ["车架号", "车架", "vin", "车辆识别代号", "架子号", "chassis"],
        label: "VIN/车架号",
    },
    engineNo: {
        fieldName: "engineNo",
        aliases: ["发动机号", "发动机", "engine", "engineno", "engine_no", "engineno."],
        label: "发动机号",
    },
    brand: {
        fieldName: "brand",
        aliases: ["品牌", "品牌型号", "model", "brand", "车型"],
        label: "品牌型号",
    },
    vehicleType: {
        fieldName: "vehicleType",
        aliases: ["车辆类型", "vehicle_type", "vehicletype", "type"],
        label: "车辆类型",
    },
    useNature: {
        fieldName: "useNature",
        aliases: ["使用性质", "usecharacter", "use_nature", "usenature", "用途"],
        label: "使用性质",
    },
    registerDate: {
        fieldName: "registerDate",
        aliases: ["注册日期", "注册时间", "registerdate", "register_date", "register"],
        label: "注册日期",
    },
    issueDate: {
        fieldName: "issueDate",
        aliases: ["发证日期", "发证时间", "issuedate", "issue_date", "issue"],
        label: "发证日期",
    },
    curbWeight: {
        fieldName: "curbWeight",
        aliases: ["整备质量", "curbweight", "curb_weight", "整车质量", "自重"],
        label: "整备质量(kg)",
    },
    approvedLoad: {
        fieldName: "approvedLoad",
        aliases: ["核定载质量", "核定载重", "approvedweight", "approved_weight", "approvedload", "approved_load", "载质量"],
        label: "核定载质量(kg)",
    },
    seats: {
        fieldName: "seats",
        aliases: ["座位数", "核定载人数", "approvedpassengercapacity", "approved_passenger_capacity", "seats"],
        label: "座位数",
    },
    energyType: {
        fieldName: "energyType",
        aliases: ["能源类型", "energytype", "energy_type", "燃料类型"],
        label: "能源类型",
        transform: (value: string) => {
            if (!value) return "FUEL";
            const normalized = String(value).toLowerCase().trim();
            // 识别新能源类型
            if (normalized.includes("新能源") ||
                normalized.includes("ev") ||
                normalized.includes("nev") ||
                normalized.includes("电") ||
                normalized === "nev") {
                return "NEV";
            }
            // 识别燃油类型
            if (normalized.includes("fuel") ||
                normalized.includes("汽油") ||
                normalized.includes("柴油") ||
                normalized.includes("燃油") ||
                normalized === "fuel") {
                return "FUEL";
            }
            // 默认为燃油
            return "FUEL";
        },
    },
};

/**
 * 车主信息字段映射
 */
export const ownerFieldMappings: Record<string, FieldMapping> = {
    ownerName: {
        fieldName: "ownerName",
        aliases: ["车主", "车主名称", "车主/所有人", "owner", "owner_name", "ownername"],
        label: "车主/所有人",
    },
    ownerPhone: {
        fieldName: "ownerPhone",
        aliases: ["电话", "手机", "手机号", "owner_phone", "ownerphone", "phone"],
        label: "联系电话",
    },
    ownerIdCard: {
        fieldName: "ownerIdCard",
        aliases: ["证件", "身份证", "证件号码", "owner_id_card", "owneridcard", "id_card", "idcard"],
        label: "证件号码",
    },
    address: {
        fieldName: "address",
        aliases: ["地址", "住址", "住址/地址", "address"],
        label: "地址",
    },
};

/**
 * 查找列在 CSV 表头中的索引
 * @param headers CSV 表头数组
 * @param fieldName 要查找的字段名
 * @returns 列索引，未找到返回 -1
 */
export function findColumnIndex(headers: string[], fieldName: string): number {
    const mapping = vehicleFieldMappings[fieldName] || ownerFieldMappings[fieldName];

    if (!mapping) {
        console.warn(`未知的字段: ${fieldName}`);
        return -1;
    }

    return headers.findIndex(header => {
        const cleanHeader = header.toLowerCase().trim();

        return mapping.aliases.some(alias => {
            const cleanAlias = alias.toLowerCase().trim();
            // 支持精确匹配或包含匹配，并去除末尾的特殊字符
            return cleanHeader === cleanAlias
                || cleanHeader.replace(/[.。_\-]+$/, '') === cleanAlias
                || cleanHeader.includes(cleanAlias);
        });
    });
    f => !getRequiredFields().includes(f)
    );
}

/**
 * 转换字段值（应用 transform 函数）
 */
export function transformFieldValue(fieldName: string, value: any): any {
    const mapping = vehicleFieldMappings[fieldName] || ownerFieldMappings[fieldName];

    if (mapping?.transform) {
        return mapping.transform(value);
    }

    return value;
}

/**
 * 验证 CSV 表头并返回列索引映射
 */
export function validateAndMapColumns(headers: string[]): {
    success: boolean;
    mapping: Record<string, number>;
    errors: string[];
} {
    const errors: string[] = [];
    const mapping: Record<string, number> = {};

    // 检查必需字段
    const requiredFields = getRequiredFields();
    for (const field of requiredFields) {
        const idx = findColumnIndex(headers, field);
        if (idx === -1) {
            const fieldMapping = vehicleFieldMappings[field];
            errors.push(`缺少必需列: ${fieldMapping?.label || field} (期望列名: ${fieldMapping?.aliases.join(" / ")})`);
        } else {
            mapping[field] = idx;
        }
    }

    // 查找所有可选字段
    const optionalFields = getOptionalFields();
    for (const field of optionalFields) {
        const idx = findColumnIndex(headers, field);
        if (idx !== -1) {
            mapping[field] = idx;
        }
    }

    // 查找车主信息字段
    for (const field of Object.keys(ownerFieldMappings)) {
        const idx = findColumnIndex(headers, field);
        if (idx !== -1) {
            mapping[field] = idx;
        }
    }

    return {
        success: errors.length === 0,
        mapping,
        errors,
    };
}
