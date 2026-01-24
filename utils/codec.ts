export type EnergyType = 'FUEL' | 'NEV';

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

export interface VehicleInfo {
  plate: string;
  owner?: string;
  vin: string;
  engineNo: string;
  brand: string;
  registerDate: string;
  vehicleType?: string;
  useNature?: string;
  curbWeight?: string;
  approvedLoad?: string;
  approvedPassengers?: string;
  licenseImage?: string;
  energyType: EnergyType;
}

export interface CoverageItem {
  type: string;
  level?: string;
  addon?: boolean;
  selectable?: boolean;
}

export interface InsuranceData {
  proposer: PersonInfo;
  insured: PersonInfo;
  vehicle: VehicleInfo;
  coverages: CoverageItem[];
}
