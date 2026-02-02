import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../utils/cn";
import type { EnergyType } from "../utils/codec";
import Header from "../components/Header";
import DocumentTypePopup from "../components/DocumentTypePopup";
import AmountSelector from "../components/AmountSelector";
import HistoryLoader from "../components/HistoryLoader";
import UseNatureSelector from "../components/UseNatureSelector";

type Step = "vehicle" | "owner" | "proposer" | "insured" | "coverages";

interface PersonInfo {
  name: string;
  idType: string;
  idCard: string;
  mobile: string;
  address: string;
  gender: "male" | "female";
  idImage: string;
  identityType: "individual" | "enterprise";
  principalName?: string;
  principalIdCard?: string;
  principalAddress?: string;
  principalGender?: "male" | "female";
  principalIdImage?: string;
  issueAuthority?: string;
  validPeriod?: string;
  nationality?: string;
  detailAddress?: string;
}

interface VehicleInfo {
  plate: string;
  vin: string;
  engineNo: string;
  brand: string;
  model: string;
  registerDate: string;
  issueDate: string;
  useNature: string;
  vehicleType: string;
  owner: string;
  inspectionDate: string;
  curbWeight: string; // 整备质量
  approvedLoad: string; // 核定载质量
  seats: string;
  energyType: EnergyType;
  licenseImage: string;
}

interface CoverageItem {
  type: string;
  name: string;
  amount?: number;
  selected: boolean;
  required?: boolean;
  parentType?: string;
}

const ApplyForm: React.FC = () => {
  const navigate = useNavigate();
  const [energyType, setEnergyType] = useState<EnergyType>("FUEL");
  const [currentStep, setCurrentStep] = useState<Step>("vehicle");
  const [isSameAsProposer, setIsSameAsProposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isNEV = energyType === "NEV";

  // 表单状态
  const [vehicle, setVehicle] = useState<VehicleInfo>({
    plate: "",
    vin: "",
    engineNo: "",
    brand: "",
    model: "",
    registerDate: "",
    issueDate: "",
    useNature: "",
    vehicleType: "客车",
    owner: "",
    inspectionDate: "",
    curbWeight: "",
    approvedLoad: "",
    seats: "",
    energyType: "FUEL",
    licenseImage: "",
  });

  const [owner, setOwner] = useState<PersonInfo>({
    name: "",
    idType: "居民身份证",
    idCard: "",
    mobile: "",
    address: "",
    gender: "male",
    idImage: "",
    identityType: "individual",
    issueAuthority: "",
    validPeriod: "",
    nationality: "中国",
    detailAddress: "",
  });

  const [proposer, setProposer] = useState<PersonInfo>({
    name: "",
    idType: "居民身份证",
    idCard: "",
    mobile: "",
    address: "",
    gender: "male",
    idImage: "",
    identityType: "individual",
    principalName: "",
    principalIdCard: "",
    principalAddress: "",
    principalGender: "male",
    issueAuthority: "",
    validPeriod: "",
    nationality: "中国",
    detailAddress: "",
  });

  const [insured, setInsured] = useState<PersonInfo>({
    name: "",
    idType: "居民身份证",
    idCard: "",
    mobile: "",
    address: "",
    gender: "male",
    idImage: "",
    identityType: "individual",
    principalName: "",
    principalIdCard: "",
    principalAddress: "",
    principalGender: "male",
    issueAuthority: "",
    validPeriod: "",
    nationality: "中国",
    detailAddress: "",
  });

  const [coverages, setCoverages] = useState<CoverageItem[]>([]);

  // 弹窗状态
  const [showDocumentPopup, setShowDocumentPopup] = useState(false);
  const [documentFor, setDocumentFor] = useState<string>("proposer");
  const [showAmountSelector, setShowAmountSelector] = useState(false);
  const [currentCoverageType, setCurrentCoverageType] = useState<string>("");
  const [showHistoryLoader, setShowHistoryLoader] = useState(false);
  const [showUseNatureSelector, setShowUseNatureSelector] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("energyType");
    if (stored === "NEV" || stored === "FUEL") {
      setEnergyType(stored);
      setVehicle(prev => ({ ...prev, energyType: stored }));
      initializeCoverages(stored);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const initializeCoverages = (type: EnergyType) => {
    const isNEV = type === "NEV";
    const prefix = isNEV ? "新能源汽车" : "机动车";

    const baseCoverages: CoverageItem[] = [
      {
        type: "damage",
        name: `${prefix}损失保险`,
        selected: false,
        required: true,
      },
      {
        type: "third_party",
        name: `${prefix}第三者责任保险`,
        amount: 1000000,
        selected: false,
        required: true,
      },
      {
        type: "driver",
        name: `${prefix}车上人员责任保险-驾驶人`,
        amount: 10000,
        selected: false,
        required: true,
      },
      {
        type: "passenger",
        name: `${prefix}车上人员责任保险-乘客`,
        amount: 10000,
        selected: false,
        required: true,
      },
    ];

    setCoverages(baseCoverages);
  };

  useEffect(() => {
    if (!energyType) return;

    const isNEV = energyType === "NEV";
    const prefix = isNEV ? "新能源汽车" : "机动车";

    let newCoverages = [...coverages.filter(c => !c.parentType)];

    const damageSelected = coverages.find(c => c.type === "damage")?.selected;
    if (damageSelected && isNEV) {
      const hasExternalGrid = newCoverages.find(c => c.type === "external_grid");
      if (!hasExternalGrid) {
        newCoverages.push({
          type: "external_grid",
          name: "附加外部电网故障损失险",
          selected: false,
          parentType: "damage",
        });
      }

      const hasRescue = newCoverages.find(c => c.type === "rescue");
      if (!hasRescue) {
        newCoverages.push({
          type: "rescue",
          name: "附加新能源汽车道路救援服务特约条款",
          selected: false,
          parentType: "damage",
        });
      }

      const hasInspection = newCoverages.find(c => c.type === "inspection");
      if (!hasInspection) {
        newCoverages.push({
          type: "inspection",
          name: "附加新能源汽车代为送检服务特约条款",
          selected: false,
          parentType: "damage",
        });
      }
    }

    const thirdPartySelected = coverages.find(c => c.type === "third_party")?.selected;
    if (thirdPartySelected) {
      const hasMedical = newCoverages.find(c => c.type === "third_party_medical");
      if (!hasMedical) {
        newCoverages.push({
          type: "third_party_medical",
          name: `附加医保外医疗费用责任险（${prefix}第三者责任保险）`,
          selected: false,
          parentType: "third_party",
        });
      }
    }

    const driverSelected = coverages.find(c => c.type === "driver")?.selected;
    if (driverSelected) {
      const hasDriverMedical = newCoverages.find(c => c.type === "driver_medical");
      if (!hasDriverMedical) {
        newCoverages.push({
          type: "driver_medical",
          name: `附加医保外医疗费用责任险（${prefix}车上人员责任保险-驾驶人）`,
          selected: false,
          parentType: "driver",
        });
      }
    }

    const passengerSelected = coverages.find(c => c.type === "passenger")?.selected;
    if (passengerSelected) {
      const hasPassengerMedical = newCoverages.find(c => c.type === "passenger_medical");
      if (!hasPassengerMedical) {
        newCoverages.push({
          type: "passenger_medical",
          name: `附加医保外医疗费用责任险（${prefix}车上人员责任保险-乘客）`,
          selected: false,
          parentType: "passenger",
        });
      }
    }

    setCoverages(newCoverages);
  }, [coverages.map(c => `${c.type}:${c.selected}`).join(","), energyType]);

  const handleImageUpload = async (file: File, setter: (value: string) => void) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        setter(reader.result as string);
        resolve();
      };
      reader.onerror = () => reject(new Error("图片读取失败"));
      reader.readAsDataURL(file);
    });
  };

  const steps: { id: Step; label: string }[] = [
    { id: "vehicle", label: "车辆" },
    { id: "owner", label: "车主" },
    { id: "proposer", label: "投保人" },
    { id: "insured", label: "被保险人" },
    { id: "coverages", label: "险种" },
  ];

  const handleNext = async () => {
    if (currentStep === "vehicle") {
      setCurrentStep("owner");
    } else if (currentStep === "owner") {
      setCurrentStep("proposer");
    } else if (currentStep === "proposer") {
      setCurrentStep("insured");
    } else if (currentStep === "insured") {
      if (isSameAsProposer) {
        setInsured({ ...proposer });
      }
      setCurrentStep("coverages");
    } else if (currentStep === "coverages") {
      await handleSubmit();
    }
  };

  // ==================== 核心提交逻辑：只调用 /api/save ====================
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          energyType,
          vehicle,
          owner,
          proposer,
          insured,
          coverages: coverages.filter(c => c.selected),
        }),
      });

      if (!response.ok) throw new Error("提交失败");

      const result = await response.json();

      // 存储application ID并跳转到状态页
      sessionStorage.setItem("applicationId", result.id);
      navigate("/status");
    } catch (error: any) {
      alert(error.message || "提交失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const openAmountSelector = (type: string) => {
    setCurrentCoverageType(type);
    setShowAmountSelector(true);
  };

  const selectAmount = (amount: number) => {
    setCoverages(prev =>
      prev.map(c => (c.type === currentCoverageType ? { ...c, amount } : c))
    );
    setShowAmountSelector(false);
  };

  const toggleCoverage = (type: string) => {
    setCoverages(prev =>
      prev.map(c => (c.type === type ? { ...c, selected: !c.selected } : c))
    );
  };

  return (
    <div className={cn(
      "min-h-screen pb-24",
      isNEV
        ? "bg-gradient-to-t from-emerald-500/30 via-emerald-500/10 to-transparent"  // 新能源：从下到上渐变（人寿绿→透明）
        : "bg-gray-50"  // 燃油车：保持不变
    )}>
      <Header
        title="新核心车险承保信息页面"
        showBackButton
        onBackClick={() => navigate("/")}
      />

      {currentStep === "vehicle" && (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <button
            type="button"
            onClick={() => setShowHistoryLoader(true)}
            className="text-sm text-emerald-600 font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导入历史投保信息
          </button>
        </div>
      )}

      <div className="sticky top-[52px] z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    currentStep === step.id
                      ? isNEV
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-500 text-white"
                      : steps.findIndex(s => s.id === currentStep) > index
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-gray-200 text-gray-400"
                  )}
                >
                  {index + 1}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1",
                    currentStep === step.id
                      ? "text-emerald-600 font-bold"
                      : "text-gray-500"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-2 mb-5",
                    steps.findIndex(s => s.id === currentStep) > index
                      ? "bg-emerald-500"
                      : "bg-gray-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 车辆信息表单 */}
        {currentStep === "vehicle" && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-500">车牌号</span>
                <input
                  value={vehicle.plate}
                  onChange={e => setVehicle({ ...vehicle, plate: e.target.value.toUpperCase() })}
                  placeholder="请输入车牌号"
                  className="text-right text-sm outline-none flex-1 ml-4"
                />
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-500">车辆类型</span>
                <select
                  value={vehicle.vehicleType}
                  onChange={e => setVehicle({ ...vehicle, vehicleType: e.target.value })}
                  className="text-right text-sm outline-none bg-transparent"
                >
                  <option value="客车">客车</option>
                  <option value="货车">货车</option>
                  <option value="特种车">特种车</option>
                </select>
                <span className="text-gray-400 ml-2">›</span>
              </div>

              <div
                className="flex items-center justify-between border-b border-gray-100 py-3 cursor-pointer"
                onClick={() => setShowUseNatureSelector(true)}
              >
                <span className="text-sm text-gray-500">车辆使用性质</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">
                    {vehicle.useNature || "请选择"}
                  </span>
                  <span className="text-gray-400">›</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-500">注册日期</span>
                <input
                  type="date"
                  value={vehicle.registerDate}
                  onChange={e => setVehicle({ ...vehicle, registerDate: e.target.value })}
                  className="text-right text-sm outline-none"
                />
                <span className="text-gray-400 ml-2">›</span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-500">发证日期</span>
                <input
                  type="date"
                  value={vehicle.issueDate}
                  onChange={e => setVehicle({ ...vehicle, issueDate: e.target.value })}
                  className="text-right text-sm outline-none"
                />
                <span className="text-gray-400 ml-2">›</span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-500">品牌型号</span>
                <input
                  value={vehicle.brand}
                  onChange={e => setVehicle({ ...vehicle, brand: e.target.value })}
                  placeholder="请输入品牌型号"
                  className="text-right text-sm outline-none flex-1 ml-4"
                />
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-500">车架号</span>
                <input
                  value={vehicle.vin}
                  onChange={e => setVehicle({ ...vehicle, vin: e.target.value.toUpperCase() })}
                  placeholder="请输入车架号"
                  className="text-right text-sm outline-none flex-1 ml-4"
                />
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-500">发动机号</span>
                <input
                  value={vehicle.engineNo}
                  onChange={e => setVehicle({ ...vehicle, engineNo: e.target.value.toUpperCase() })}
                  placeholder="请输入发动机号"
                  className="text-right text-sm outline-none flex-1 ml-4"
                />
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-500">整备质量(kg)</span>
                <input
                  value={vehicle.curbWeight}
                  onChange={e => setVehicle({ ...vehicle, curbWeight: e.target.value })}
                  placeholder="请输入整备质量"
                  className="text-right text-sm outline-none flex-1 ml-4"
                />
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-500">核定载质量(kg)</span>
                <input
                  value={vehicle.approvedLoad}
                  onChange={e => setVehicle({ ...vehicle, approvedLoad: e.target.value })}
                  placeholder="请输入核定载质量"
                  className="text-right text-sm outline-none flex-1 ml-4"
                />
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-500">核定载客</span>
                <input
                  value={vehicle.seats}
                  onChange={e => setVehicle({ ...vehicle, seats: e.target.value })}
                  placeholder="请输入核定载客人数"
                  className="text-right text-sm outline-none flex-1 ml-4"
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">行驶证照片</span>
                <label className="text-sm text-emerald-600 cursor-pointer">
                  {vehicle.licenseImage ? "已上传 ✓" : "点击上传"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, val => setVehicle({ ...vehicle, licenseImage: val }));
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 车主信息 - 完整表单省略，保持原有UI */}
        {/* 投保人信息 - 完整表单省略，保持原有UI */}
        {/* 被保险人信息 - 完整表单省略，保持原有UI */}
        {/* 险种选择 - 完整表单省略，保持原有UI */}
      </main>

      <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 p-4">
        <button
          type="button"
          onClick={handleNext}
          disabled={submitting}
          className={cn(
            "w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all active:scale-[0.98]",
            isNEV
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
              : "bg-emerald-500",
            submitting && "opacity-50 cursor-not-allowed"
          )}
        >
          {submitting ? "提交中..." : currentStep === "coverages" ? "提交投保" : "下一步"}
        </button>
      </div>

      <DocumentTypePopup
        visible={showDocumentPopup}
        onClose={() => setShowDocumentPopup(false)}
        onSelect={type => {
          if (documentFor === "owner") {
            setOwner({ ...owner, idType: type });
          } else if (documentFor === "proposer") {
            setProposer({ ...proposer, idType: type });
          } else if (documentFor === "insured") {
            setInsured({ ...insured, idType: type });
          }
        }}
        currentValue={
          documentFor === "owner"
            ? owner.idType
            : documentFor === "proposer"
              ? proposer.idType
              : insured.idType
        }
      />

      <AmountSelector
        visible={showAmountSelector}
        onClose={() => setShowAmountSelector(false)}
        type={currentCoverageType}
        currentAmount={coverages.find(c => c.type === currentCoverageType)?.amount}
        onSelect={selectAmount}
      />

      <HistoryLoader
        visible={showHistoryLoader}
        onClose={() => setShowHistoryLoader(false)}
        onLoad={(app) => {
          setVehicle(app.vehicle);
          setOwner(app.owner);
          setProposer(app.proposer);
          setInsured(app.insured);
          setCoverages(app.coverages);
          setEnergyType(app.energyType);
          alert("历史投保信息已导入");
        }}
      />

      <UseNatureSelector
        visible={showUseNatureSelector}
        onClose={() => setShowUseNatureSelector(false)}
        onSelect={(value) => {
          setVehicle({ ...vehicle, useNature: value });
        }}
        currentValue={vehicle.useNature}
      />
    </div>
  );
};

export default ApplyForm;
