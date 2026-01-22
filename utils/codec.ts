export type CoverageItem = {
  type: string;
  level: string;
};

export type PersonInfo = {
  name: string;
  idType: string;
  idCard: string;
  mobile: string;
  address: string;

  // 证件图片
  idImage?: string;

  // 企业负责人信息（仅企业时使用）
  principalName?: string;
  principalIdCard?: string;
  principalAddress?: string;
  principalIdImage?: string;
};

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

export type InsuranceData = {
  insuranceOwner?: PersonInfo;
  proposer: PersonInfo;
  insured: PersonInfo;
  vehicle: VehicleInfo;
  coverages: CoverageItem[];
};
