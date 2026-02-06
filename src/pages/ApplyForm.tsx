import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../utils/cn";
import type { EnergyType } from "../utils/codec";
import Header from "../components/Header";
import DocumentTypePopup from "../components/DocumentTypePopup";
import AmountSelector from "../components/AmountSelector";
import HistoryLoader from "../components/HistoryLoader";
import UseNatureSelector from "../components/UseNatureSelector";
import CRMCustomerPicker from "../components/CRMCustomerPicker";
import CRMVehiclePicker from "../components/CRMVehiclePicker";
import type { CRMCustomer, CRMVehicle } from "../utils/crmStorage";

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

  // CRM 选择器状态
  const [showCRMCustomerPicker, setShowCRMCustomerPicker] = useState(false);
  const [showCRMVehiclePicker, setShowCRMVehiclePicker] = useState(false);
  const [crmTargetFor, setCRMTargetFor] = useState<"owner" | "proposer" | "insured">("owner");

  // Auto-load draft data
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem("apply_form_draft");
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.step) setCurrentStep(parsed.step);
        if (parsed.vehicle) setVehicle(parsed.vehicle);
        if (parsed.owner) setOwner(parsed.owner);
        if (parsed.proposer) setProposer(parsed.proposer);
        if (parsed.insured) setInsured(parsed.insured);
        if (parsed.coverages) setCoverages(parsed.coverages);
        if (parsed.energyType) setEnergyType(parsed.energyType);
      } else {
        // Only initialize default if no draft exists
        const storedType = sessionStorage.getItem("energyType");
        if (storedType === "NEV" || storedType === "FUEL") {
          setEnergyType(storedType);
          setVehicle(prev => ({ ...prev, energyType: storedType }));
          initializeCoverages(storedType);
        } else {
          setEnergyType("FUEL");
          initializeCoverages("FUEL");
        }
      }
    } catch (e) {
      console.error("Failed to load draft", e);
    }
  }, []);

  // Auto-save draft data
  useEffect(() => {
    const draft = {
      step: currentStep,
      vehicle,
      owner,
      proposer,
      insured,
      coverages,
      energyType
    };
    sessionStorage.setItem("apply_form_draft", JSON.stringify(draft));
  }, [currentStep, vehicle, owner, proposer, insured, coverages, energyType]);

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

    // Start with parent coverages only
    let newCoverages = [...coverages.filter(c => !c.parentType)];

    // Helper to find existing state for child coverages
    const getExistingState = (type: string) => {
      const existing = coverages.find(c => c.type === type);
      return {
        selected: existing ? existing.selected : false,
        amount: existing?.amount
      };
    };

    const damageSelected = coverages.find(c => c.type === "damage")?.selected;
    if (damageSelected && isNEV) {
      const hasExternalGrid = newCoverages.find(c => c.type === "external_grid");
      if (!hasExternalGrid) {
        const state = getExistingState("external_grid");
        newCoverages.push({
          type: "external_grid",
          name: "附加外部电网故障损失险",
          selected: state.selected,
          amount: state.amount,
          parentType: "damage",
        });
      }

      const hasRescue = newCoverages.find(c => c.type === "rescue");
      if (!hasRescue) {
        const state = getExistingState("rescue");
        newCoverages.push({
          type: "rescue",
          name: "附加新能源汽车道路救援服务特约条款",
          selected: state.selected,
          amount: state.amount,
          parentType: "damage",
        });
      }

      const hasInspection = newCoverages.find(c => c.type === "inspection");
      if (!hasInspection) {
        const state = getExistingState("inspection");
        newCoverages.push({
          type: "inspection",
          name: "附加新能源汽车代为送检服务特约条款",
          selected: state.selected,
          amount: state.amount,
          parentType: "damage",
        });
      }
    }

    const thirdPartySelected = coverages.find(c => c.type === "third_party")?.selected;
    if (thirdPartySelected) {
      const hasMedical = newCoverages.find(c => c.type === "third_party_medical");
      if (!hasMedical) {
        const state = getExistingState("third_party_medical");
        newCoverages.push({
          type: "third_party_medical",
          name: `附加医保外医疗费用责任险（${prefix}第三者责任保险）`,
          selected: state.selected,
          amount: state.amount,
          parentType: "third_party",
        });
      }
    }

    const driverSelected = coverages.find(c => c.type === "driver")?.selected;
    if (driverSelected) {
      const hasDriverMedical = newCoverages.find(c => c.type === "driver_medical");
      if (!hasDriverMedical) {
        const state = getExistingState("driver_medical");
        newCoverages.push({
          type: "driver_medical",
          name: `附加医保外医疗费用责任险（${prefix}车上人员责任保险-驾驶人）`,
          selected: state.selected,
          amount: state.amount,
          parentType: "driver",
        });
      }
    }

    const passengerSelected = coverages.find(c => c.type === "passenger")?.selected;
    if (passengerSelected) {
      const hasPassengerMedical = newCoverages.find(c => c.type === "passenger_medical");
      if (!hasPassengerMedical) {
        const state = getExistingState("passenger_medical");
        newCoverages.push({
          type: "passenger_medical",
          name: `附加医保外医疗费用责任险（${prefix}车上人员责任保险-乘客）`,
          selected: state.selected,
          amount: state.amount,
          parentType: "passenger",
        });
      }
    }

    // Only update if structure actually changed (prevent infinite loops)
    if (JSON.stringify(newCoverages) !== JSON.stringify(coverages)) {
      setCoverages(newCoverages);
    }
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

  const handlePrev = () => {
    if (currentStep === "owner") {
      setCurrentStep("vehicle");
    } else if (currentStep === "proposer") {
      setCurrentStep("owner");
    } else if (currentStep === "insured") {
      setCurrentStep("proposer");
    } else if (currentStep === "coverages") {
      setCurrentStep("insured");
    }
  };

  // ==================== 核心提交逻辑：调用 /api/application/apply ====================
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const applicationData = {
        energyType,
        vehicle,
        owner,
        proposer,
        insured,
        coverages: coverages.filter(c => c.selected),
      };

      // 调用 API 保存到 KV（核保端需要读取这个数据）
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${API_BASE_URL}/api/policy.salesman`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({ error: "请求处理失败" }));
        throw new Error(errorResult.error || `服务器错误: ${response.status}`);
      }

      const result = await response.json();
      // 存储 application ID 并跳转到状态页
      // 提交成功后清除草稿
      sessionStorage.removeItem("apply_form_draft");
      sessionStorage.setItem("applicationId", result.proposalId);
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

  // CRM 导入处理函数
  const handleImportCustomer = (target: "owner" | "proposer" | "insured") => {
    setCRMTargetFor(target);
    setShowCRMCustomerPicker(true);
  };

  const handleSelectCustomer = (customer: CRMCustomer) => {
    const personInfo: PersonInfo = {
      name: customer.name,
      idType: customer.idType,
      idCard: customer.idCard,
      mobile: customer.mobile,
      address: customer.address,
      gender: customer.gender,
      idImage: "",
      identityType: customer.identityType,
      principalName: customer.principalName,
      principalIdCard: customer.principalIdCard,
      principalAddress: customer.principalAddress,
      principalGender: customer.principalGender,
      issueAuthority: customer.issueAuthority,
      validPeriod: customer.validPeriod,
      nationality: customer.nationality,
      detailAddress: customer.detailAddress,
    };

    if (crmTargetFor === "owner") {
      setOwner(personInfo);
    } else if (crmTargetFor === "proposer") {
      setProposer(personInfo);
    } else if (crmTargetFor === "insured") {
      setInsured(personInfo);
    }
  };

  const handleSelectVehicle = (vehicleData: CRMVehicle) => {
    // 更新车辆信息
    setVehicle({
      plate: vehicleData.plate,
      vin: vehicleData.vin,
      engineNo: vehicleData.engineNo,
      brand: vehicleData.brand,
      model: "",
      registerDate: vehicleData.registerDate,
      issueDate: vehicleData.issueDate,
      useNature: vehicleData.useNature,
      vehicleType: vehicleData.vehicleType,
      owner: "",
      inspectionDate: "",
      curbWeight: vehicleData.curbWeight,
      approvedLoad: vehicleData.approvedLoad,
      seats: vehicleData.seats,
      energyType: vehicleData.energyType,
      licenseImage: "",
    });

    // 根据车辆能源类型重新初始化险种
    setEnergyType(vehicleData.energyType);
    initializeCoverages(vehicleData.energyType);
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
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
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
          <button
            type="button"
            onClick={() => setShowCRMVehiclePicker(true)}
            className="text-sm text-blue-600 font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            从 CRM 导入
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
                <div className="flex items-center flex-1 justify-end ml-4 gap-2">
                  <select
                    value={vehicle.plate ? vehicle.plate.substring(0, 1) : "苏"}
                    onChange={e => {
                      const prefix = e.target.value;
                      const suffix = vehicle.plate ? vehicle.plate.substring(1) : "";
                      setVehicle({ ...vehicle, plate: prefix + suffix });
                    }}
                    className="text-sm font-bold text-gray-700 bg-gray-50 rounded px-1 py-0.5 outline-none border border-transparent hover:border-emerald-200 transition-colors cursor-pointer appearance-none text-center min-w-[3em]"
                    style={{ textAlignLast: 'center' }}
                  >
                    {["京", "津", "冀", "晋", "蒙", "辽", "吉", "黑", "沪", "苏", "浙", "皖", "闽", "赣", "鲁", "豫", "鄂", "湘", "粤", "桂", "琼", "渝", "川", "贵", "云", "藏", "陕", "甘", "青", "宁", "新", "港", "澳", "台"].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <input
                    value={vehicle.plate ? vehicle.plate.substring(1) : ""}
                    onChange={e => {
                      const prefix = vehicle.plate ? vehicle.plate.substring(0, 1) : "苏";
                      const suffix = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                      setVehicle({ ...vehicle, plate: prefix + suffix });
                    }}
                    placeholder="请输入号码"
                    className="text-right text-sm font-bold text-gray-800 outline-none w-24 uppercase placeholder-gray-300"
                  />
                </div>
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


        {/* 车主信息 */}
        {currentStep === "owner" && (
          <>
            <div className="bg-white border-b border-gray-200 px-4 py-2">
              <button
                type="button"
                onClick={() => handleImportCustomer("owner")}
                className="text-sm text-blue-600 font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                从 CRM 导入车主
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 py-3">
                  <span className="text-sm text-gray-500">姓名/企业名称</span>
                  <input
                    value={owner.name}
                    onChange={e => setOwner({ ...owner, name: e.target.value })}
                    placeholder="请输入姓名"
                    className="text-right text-sm outline-none flex-1 ml-4"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 py-3 cursor-pointer"
                  onClick={() => { setDocumentFor("owner"); setShowDocumentPopup(true); }}
                >
                  <span className="text-sm text-gray-500">证件类型</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800">{owner.idType}</span>
                    <span className="text-gray-400">›</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 py-3">
                  <span className="text-sm text-gray-500">证件号码</span>
                  <input
                    value={owner.idCard}
                    onChange={e => setOwner({ ...owner, idCard: e.target.value.toUpperCase() })}
                    placeholder="请输入证件号码"
                    className="text-right text-sm outline-none flex-1 ml-4"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 py-3">
                  <span className="text-sm text-gray-500">手机号</span>
                  <input
                    value={owner.mobile}
                    onChange={e => setOwner({ ...owner, mobile: e.target.value })}
                    placeholder="请输入手机号"
                    className="text-right text-sm outline-none flex-1 ml-4"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500">证件照片</span>
                  <label className="text-sm text-emerald-600 cursor-pointer">
                    {owner.idImage ? "已上传 ✓" : "点击上传"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, val => setOwner({ ...owner, idImage: val }));
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 投保人信息 */}
        {currentStep === "proposer" && (
          <>
            <div className="bg-white border-b border-gray-200 px-4 py-2">
              <button
                type="button"
                onClick={() => handleImportCustomer("proposer")}
                className="text-sm text-blue-600 font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                从 CRM 导入投保人
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 py-3">
                  <span className="text-sm text-gray-500">姓名/企业名称</span>
                  <input
                    value={proposer.name}
                    onChange={e => setProposer({ ...proposer, name: e.target.value })}
                    placeholder="请输入姓名"
                    className="text-right text-sm outline-none flex-1 ml-4"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 py-3 cursor-pointer"
                  onClick={() => { setDocumentFor("proposer"); setShowDocumentPopup(true); }}
                >
                  <span className="text-sm text-gray-500">证件类型</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800">{proposer.idType}</span>
                    <span className="text-gray-400">›</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 py-3">
                  <span className="text-sm text-gray-500">证件号码</span>
                  <input
                    value={proposer.idCard}
                    onChange={e => setProposer({ ...proposer, idCard: e.target.value.toUpperCase() })}
                    placeholder="请输入证件号码"
                    className="text-right text-sm outline-none flex-1 ml-4"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 py-3">
                  <span className="text-sm text-gray-500">手机号</span>
                  <input
                    value={proposer.mobile}
                    onChange={e => setProposer({ ...proposer, mobile: e.target.value })}
                    placeholder="请输入手机号"
                    className="text-right text-sm outline-none flex-1 ml-4"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-500">证件照片</span>
                  <label className="text-sm text-emerald-600 cursor-pointer">
                    {proposer.idImage ? "已上传 ✓" : "点击上传"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, val => setProposer({ ...proposer, idImage: val }));
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 被保险人信息 */}
        {currentStep === "insured" && (
          <>
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleImportCustomer("insured")}
                className="text-sm text-blue-600 font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                从 CRM 导入被保险人
              </button>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isSameAsProposer}
                  onChange={e => {
                    setIsSameAsProposer(e.target.checked);
                    if (e.target.checked) {
                      setInsured({ ...proposer });
                    }
                  }}
                  className="w-4 h-4 text-emerald-600"
                />
                <span className="text-gray-700">同投保人</span>
              </label>
            </div>
            {!isSameAsProposer && (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 py-3">
                    <span className="text-sm text-gray-500">姓名/企业名称</span>
                    <input
                      value={insured.name}
                      onChange={e => setInsured({ ...insured, name: e.target.value })}
                      placeholder="请输入姓名"
                      className="text-right text-sm outline-none flex-1 ml-4"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 py-3 cursor-pointer"
                    onClick={() => { setDocumentFor("insured"); setShowDocumentPopup(true); }}
                  >
                    <span className="text-sm text-gray-500">证件类型</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-800">{insured.idType}</span>
                      <span className="text-gray-400">›</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 py-3">
                    <span className="text-sm text-gray-500">证件号码</span>
                    <input
                      value={insured.idCard}
                      onChange={e => setInsured({ ...insured, idCard: e.target.value.toUpperCase() })}
                      placeholder="请输入证件号码"
                      className="text-right text-sm outline-none flex-1 ml-4"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 py-3">
                    <span className="text-sm text-gray-500">手机号</span>
                    <input
                      value={insured.mobile}
                      onChange={e => setInsured({ ...insured, mobile: e.target.value })}
                      placeholder="请输入手机号"
                      className="text-right text-sm outline-none flex-1 ml-4"
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-500">证件照片</span>
                    <label className="text-sm text-emerald-600 cursor-pointer">
                      {insured.idImage ? "已上传 ✓" : "点击上传"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, val => setInsured({ ...insured, idImage: val }));
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
            {isSameAsProposer && (
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-sm text-emerald-600">被保险人信息与投保人相同</p>
              </div>
            )}
          </>
        )}

        {/* 险种选择 */}
        {currentStep === "coverages" && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 space-y-3">
              {coverages.filter(c => c.required).map(coverage => (
                <div key={coverage.type} className="border-b border-gray-100 pb-3">
                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={coverage.selected}
                        onChange={() => toggleCoverage(coverage.type)}
                        className="w-5 h-5 text-emerald-600"
                      />
                      <span className="text-sm font-medium text-gray-800">{coverage.name}</span>
                    </div>
                    {coverage.amount && (
                      <button
                        type="button"
                        onClick={() => openAmountSelector(coverage.type)}
                        className="text-sm text-emerald-600"
                      >
                        {coverage.amount.toLocaleString()}元 ›
                      </button>
                    )}
                  </label>
                </div>
              ))}

              {coverages.filter(c => c.parentType).length > 0 && (
                <>
                  <div className="pt-3">
                    <h4 className="text-xs font-bold text-gray-500 mb-2">附加险</h4>
                  </div>
                  {coverages.filter(c => c.parentType).map(coverage => (
                    <div key={coverage.type} className="border-b border-gray-100 pb-3">
                      <label className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={coverage.selected}
                            onChange={() => toggleCoverage(coverage.type)}
                            className="w-5 h-5 text-emerald-600"
                          />
                          <span className="text-sm text-gray-700">{coverage.name}</span>
                        </div>
                        {coverage.amount && (
                          <button
                            type="button"
                            onClick={() => openAmountSelector(coverage.type)}
                            className="text-sm text-emerald-600"
                          >
                            {coverage.amount.toLocaleString()}元 ›
                          </button>
                        )}
                      </label>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          {currentStep !== "vehicle" && (
            <button
              type="button"
              onClick={handlePrev}
              className="flex-1 py-3.5 rounded-xl font-bold border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              上一步
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className={cn(
              "flex-1 py-3.5 rounded-xl text-white font-bold shadow-lg transition-all active:scale-[0.98]",
              isNEV
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                : "bg-emerald-500",
              submitting && "opacity-50 cursor-not-allowed",
              currentStep === "vehicle" && "flex-[2]"
            )}
          >
            {submitting ? "提交中..." : currentStep === "coverages" ? "提交投保" : "下一步"}
          </button>
        </div>
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

      <CRMCustomerPicker
        visible={showCRMCustomerPicker}
        onClose={() => setShowCRMCustomerPicker(false)}
        onSelect={handleSelectCustomer}
      />

      <CRMVehiclePicker
        visible={showCRMVehiclePicker}
        onClose={() => setShowCRMVehiclePicker(false)}
        onSelect={handleSelectVehicle}
      />
    </div>
  );
};

export default ApplyForm;
