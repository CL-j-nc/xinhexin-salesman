/**
 * 保险险种配置
 * 统一管理机动车和新能源汽车的保险险种
 */

export interface CoverageConfig {
    type: string;
    nameByEnergyType: {
        FUEL: string;  // 机动车名称
        NEV: string;   // 新能源汽车名称
    };
    label: string;  // 标准标签
    amount?: number;
    required?: boolean;
    category: "basic" | "additional";
    applicableTo: ("FUEL" | "NEV" | "both")[];
    description?: string;
    parentType?: string; // 用于指定附加险的父险种
}

/**
 * 获取险种的显示名称
 */
export function getCoverageName(config: CoverageConfig, energyType: "FUEL" | "NEV"): string {
    return config.nameByEnergyType[energyType];
}

/**
 * 险种分类：
 * - basic: 主要险种（车损、第三者等）
 * - additional: 附加险
 */

export const COVERAGE_CONFIGS: Record<string, CoverageConfig> = {
    // ========== 基础险种 ==========
    damage: {
        type: "damage",
        nameByEnergyType: {
            FUEL: "机动车损失保险",
            NEV: "新能源汽车损失保险",
        },
        label: "机动车损失保险",
        amount: undefined,
        required: true,
        category: "basic",
        applicableTo: ["FUEL", "NEV"],
        description: "被保险车辆遭受保险事故造成的损失",
    },

    third_party: {
        type: "third_party",
        nameByEnergyType: {
            FUEL: "机动车第三者责任保险",
            NEV: "新能源汽车第三者责任保险",
        },
        label: "机动车第三者责任保险",
        amount: 1000000,
        required: true,
        category: "basic",
        applicableTo: ["FUEL", "NEV"],
        description: "被保险人依法应当承担的经济赔偿责任",
    },

    driver: {
        type: "driver",
        nameByEnergyType: {
            FUEL: "机动车车上人员责任保险-驾驶人",
            NEV: "新能源汽车车上人员责任保险-驾驶人",
        },
        label: "机动车车上人员责任保险-驾驶人",
        amount: 10000,
        required: false,
        category: "basic",
        applicableTo: ["FUEL", "NEV"],
        description: "被保险车辆上驾驶人遭受人身伤害",
    },

    passenger: {
        type: "passenger",
        nameByEnergyType: {
            FUEL: "机动车车上人员责任保险-乘客",
            NEV: "新能源汽车车上人员责任保险-乘客",
        },
        label: "机动车车上人员责任保险-乘客",
        amount: 10000,
        required: false,
        category: "basic",
        applicableTo: ["FUEL", "NEV"],
        description: "被保险车辆上除驾驶人外的乘客遭受人身伤害",
    },

    // ========== 新能源专有附加险 ==========
    external_grid: {
        type: "external_grid",
        nameByEnergyType: {
            FUEL: "外部电网故障险",
            NEV: "附加外部电网故障损失险",
        },
        label: "附加外部电网故障损失险",
        amount: undefined,
        required: false,
        category: "additional",
        applicableTo: ["NEV"],
        description: "被保险新能源汽车电池因外部电网故障导致的损失",
        parentType: "damage",
    },

    battery_fault: {
        type: "battery_fault",
        nameByEnergyType: {
            FUEL: "电池故障险",
            NEV: "附加新能源汽车电池故障损失险",
        },
        label: "附加新能源汽车电池故障损失险",
        amount: undefined,
        required: false,
        category: "additional",
        applicableTo: ["NEV"],
        description: "被保险新能源汽车电池因非碰撞导致的故障",
        parentType: "damage",
    },

    rescue: {
        type: "rescue",
        nameByEnergyType: {
            FUEL: "道路救援服务",
            NEV: "附加新能源汽车道路救援服务特约条款",
        },
        label: "附加新能源汽车道路救援服务特约条款",
        amount: undefined,
        required: false,
        category: "additional",
        applicableTo: ["NEV"],
        description: "新能源汽车专属道路救援和故障处理服务",
        parentType: "damage",
    },

    inspection: {
        type: "inspection",
        nameByEnergyType: {
            FUEL: "代为送检服务",
            NEV: "附加新能源汽车代为送检服务特约条款",
        },
        label: "附加新能源汽车代为送检服务特约条款",
        amount: undefined,
        required: false,
        category: "additional",
        applicableTo: ["NEV"],
        description: "新能源汽车定期检测代为送检服务",
        parentType: "damage",
    },

    // ========== 通用附加险 ==========
    third_party_medical: {
        type: "third_party_medical",
        nameByEnergyType: {
            FUEL: "附加医保外医疗费用责任险（机动车第三者责任）",
            NEV: "附加医保外医疗费用责任险（新能源汽车第三者责任）",
        },
        label: "附加医保外医疗费用责任险（第三者责任）",
        amount: undefined,
        required: false,
        category: "additional",
        applicableTo: ["FUEL", "NEV"],
        description: "被保险人在第三者责任保险基础上的医疗费用补充",
        parentType: "third_party",
    },

    driver_medical: {
        type: "driver_medical",
        nameByEnergyType: {
            FUEL: "附加医保外医疗费用责任险（机动车车上人员责任保险-驾驶人）",
            NEV: "附加医保外医疗费用责任险（新能源汽车车上人员责任保险-驾驶人）",
        },
        label: "附加医保外医疗费用责任险（驾驶人）",
        amount: undefined,
        required: false,
        category: "additional",
        applicableTo: ["FUEL", "NEV"],
        description: "驾驶人遭受人身伤害的医保外医疗费用补充",
        parentType: "driver",
    },

    passenger_medical: {
        type: "passenger_medical",
        nameByEnergyType: {
            FUEL: "附加医保外医疗费用责任险（机动车车上人员责任保险-乘客）",
            NEV: "附加医保外医疗费用责任险（新能源汽车车上人员责任保险-乘客）",
        },
        label: "附加医保外医疗费用责任险（乘客）",
        amount: undefined,
        required: false,
        category: "additional",
        applicableTo: ["FUEL", "NEV"],
        description: "乘客遭受人身伤害的医保外医疗费用补充",
        parentType: "passenger",
    },

    no_deductible: {
        type: "no_deductible",
        nameByEnergyType: {
            FUEL: "附加不计免赔率特约条款",
            NEV: "附加不计免赔率特约条款",
        },
        label: "附加不计免赔率特约条款",
        amount: undefined,
        required: false,
        category: "additional",
        applicableTo: ["FUEL", "NEV"],
        description: "免除被保险人应承担的免赔金额",
        parentType: "damage",
    },

    glass_breakage: {
        type: "glass_breakage",
        nameByEnergyType: {
            FUEL: "附加玻璃单独破损险",
            NEV: "附加玻璃单独破损险",
        },
        label: "附加玻璃单独破损险",
        amount: undefined,
        required: false,
        category: "additional",
        applicableTo: ["FUEL", "NEV"],
        description: "被保险车辆玻璃单独破损的损失",
        parentType: "damage",
    },

    spontaneous_combustion: {
        type: "spontaneous_combustion",
        nameByEnergyType: {
            FUEL: "附加自燃损失险",
            NEV: "附加自燃损失险",
        },
        label: "附加自燃损失险",
        amount: undefined,
        required: false,
        category: "additional",
        applicableTo: ["FUEL", "NEV"],
        description: "被保险车辆因自燃导致的损失",
        parentType: "damage",
    },

    theft: {
        type: "theft",
        nameByEnergyType: {
            FUEL: "附加全车盗抢险",
            NEV: "附加全车盗抢险",
        },
        label: "附加全车盗抢险",
        amount: undefined,
        required: false,
        category: "additional",
        applicableTo: ["FUEL", "NEV"],
        description: "被保险车辆全车被盗抢的损失",
        parentType: "damage",
    },
};

/**
 * 获取适用于特定能源类型的险种配置
 */
export function getApplicableCoverages(energyType: "FUEL" | "NEV"): CoverageConfig[] {
    return Object.values(COVERAGE_CONFIGS).filter(
        config => config.applicableTo.includes(energyType) || config.applicableTo.includes("both")
    );
}

/**
 * 获取必需险种（required）
 */
export function getRequiredCoverages(energyType: "FUEL" | "NEV"): CoverageConfig[] {
    return getApplicableCoverages(energyType).filter(
        config => Boolean(config.required)
    );
}

/**
 * 获取可选险种（非 required）
 */
export function getOptionalCoverages(energyType: "FUEL" | "NEV"): CoverageConfig[] {
    return getApplicableCoverages(energyType).filter(
        config => !config.required
    );
}

/**
 * 按分类分组险种
 */
export function groupCoveragesByCategory(
    energyType: "FUEL" | "NEV"
): Record<string, CoverageConfig[]> {
    const coverages = getApplicableCoverages(energyType);
    const grouped: Record<string, CoverageConfig[]> = {
        basic: [],
        additional: [],
    };

    coverages.forEach(coverage => {
        const category = coverage.category;
        if (grouped[category]) {
            grouped[category].push(coverage);
        }
    });

    return grouped;
}

/**
 * 获取单个险种配置
 */
export function getCoverageConfig(type: string): CoverageConfig | undefined {
    return COVERAGE_CONFIGS[type];
}

/**
 * 检查一个险种是否有子险种（附加险）
 */
export function hasChildCoverages(parentType: string, energyType: "FUEL" | "NEV"): boolean {
    return getApplicableCoverages(energyType).some(c => c.parentType === parentType);
}

/**
 * 获取某个险种的所有子险种（附加险）
 */
export function getChildCoverages(parentType: string, energyType: "FUEL" | "NEV"): CoverageConfig[] {
    return getApplicableCoverages(energyType).filter(c => c.parentType === parentType);
}
