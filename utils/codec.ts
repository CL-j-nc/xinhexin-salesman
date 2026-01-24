/**
 * ================================
 *  核心数据结构定义（Salesman）
 * ================================
 */

export type CoverageItem = {
  type: string;
  level?: string;
  addon?: boolean;        // 是否附加险
  selectable?: boolean;   // 是否可选（灰选用）
};

export interface PersonInfo {
  name: string;
  idType: string;
  idCard: string;
  mobile: string;
  address: string;
  idImage: string;

  principalName?: string;
  principalIdCard?: string;
  principalAddress?: string;
  principalIdImage?: string;

  verifyCode?: string;
  verified?: boolean;
}

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
  energyType: 'FUEL' | 'NEV';
};

export type InsuranceData = {
  insuranceOwner?: PersonInfo;
  proposer: PersonInfo;
  insured: PersonInfo;
  vehicle: VehicleInfo;
  coverages: CoverageItem[];
};
