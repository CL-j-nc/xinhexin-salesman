/**
 * ================================
 *  核心数据结构定义（Salesman）
 * ================================
 */

/**
 * 单个险种选择
 */
export type CoverageItem = {
  type: string;   // third_party / damage / driver / passenger
  level: string;  // 额度描述
};

/**
 * 人员信息（投保人 / 被保险人）
 */
export interface PersonInfo {
  /** 基础信息 */
  name: string;
  idType: string;
  idCard: string;
  mobile: string;
  address: string;
  idImage: string;

  /** 企业主体字段（当证件类型为营业执照时启用） */
  principalName?: string;
  principalIdCard?: string;
  principalAddress?: string;
  principalIdImage?: string;

  /** 📱 手机验证码校验（真实流程） */
  verifyCode?: string;
  verified?: boolean;
}

/**
 * 车辆信息
 */
export type VehicleInfo = {
  plate: string;
  vin: string;
  engineNo: string;
  brand: string;
  registerDate: string;

  owner: string;
  vehicleType?: string;
  useNature?: string;

  curbWeight: string;
  approvedLoad: string;
  approvedPassengers: string;

  licenseImage?: string;
};

/**
 * 整个投保数据结构
 */
export type InsuranceData = {
  /** 可选：保单实际归属人（当前未启用，预留） */
  insuranceOwner?: PersonInfo;

  /** 投保人 */
  proposer: PersonInfo;

  /** 被保险人 */
  insured: PersonInfo;

  /** 车辆信息 */
  vehicle: VehicleInfo;

  /** 险种选择 */
  coverages: CoverageItem[];
};