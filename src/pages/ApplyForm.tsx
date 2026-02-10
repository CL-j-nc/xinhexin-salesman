import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { getApplicableCoverages, getCoverageName } from "../utils/coverageConfig";
import { ApiRequestError, fetchJsonWithFallback } from "../utils/apiClient";

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

const DEFAULT_ENERGY_TYPE: EnergyType = "FUEL";

type PersistedDraft = {
  step: Step;
  vehicle: VehicleInfo;
  owner: PersonInfo;
  proposer: PersonInfo;
  insured: PersonInfo;
  coverages: CoverageItem[];
  energyType: EnergyType;
};

interface DraftGetResponse {
  success: boolean;
  data: PersistedDraft | null;
  updatedAt?: string;
}

interface DraftLatestResponse {
  success: boolean;
  data: {
    draftId: string;
    updatedAt?: string;
  } | null;
}

const isEnergyType = (value: unknown): value is EnergyType =>
  value === "FUEL" || value === "NEV";

// 智能日期输入组件：支持 YYYYMMDD 输入，自动格式化为 YYYY-MM-DD
const SmartDateInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    setDisplay(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9-]/g, ""); // 允许数字和横杠

    // 如果用户输入的是纯数字 8 位 (20230101) -> 自动转 2023-01-01
    const digits = raw.replace(/-/g, "");
    if (digits.length === 8) {
      const y = digits.slice(0, 4);
      const m = digits.slice(4, 6);
      const d = digits.slice(6, 8);
      // 简单校验月份日期
      if (parseInt(m) > 0 && parseInt(m) <= 12 && parseInt(d) > 0 && parseInt(d) <= 31) {
        const formatted = `${y}-${m}-${d}`;
        // 更新父组件
        onChange(formatted);
        raw = formatted; // 显示格式化后的
      }
    } else {
      // 尚未完成输入，暂停更新父组件（或者实时更新？）
      // 如果实时更新非日期格式，可能导致父组件校验失败。
      //这里选择：只在 blur 或 格式正确时更新父组件
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        onChange(raw);
      }
    }
    setDisplay(raw);
  };

  const handleBlur = () => {
    // 失去焦点时，尝试最大限度格式化
    const digits = display.replace(/[^0-9]/g, "");
    if (digits.length === 8) {
      const y = digits.slice(0, 4);
      const m = digits.slice(4, 6);
      const d = digits.slice(6, 8);
      const formatted = `${y}-${m}-${d}`;
      setDisplay(formatted);
      onChange(formatted);
    } else if (digits.length === 0) {
      onChange("");
    } else {
      // 格式不正确，重置为上一次有效值（或保持原样让用户改）
      // 保持原样最好
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || "YYYYMMDD"}
        className="text-right text-sm outline-none w-32 bg-transparent font-mono tracking-wide placeholder-gray-300"
        maxLength={10}
      />
    </div>
  );
};

const createDraftId = (): string => `DRF-${crypto.randomUUID()}`;

const ApplyForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // 默认起保日期为明天
  const [policyEffectiveDate, setPolicyEffectiveDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

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
  const skipNextCoverageInitRef = useRef(false);
  const draftSaveTimerRef = useRef<number | null>(null);
  const draftInitDoneRef = useRef(false);
  const [draftId, setDraftId] = useState<string>("");
  const [draftBootstrapped, setDraftBootstrapped] = useState(false);
  const searchParamString = searchParams.toString();

  // 读取 URL 中的 draftId / energyType，并从 D1 加载草稿
  useEffect(() => {
    if (draftInitDoneRef.current) return;
    draftInitDoneRef.current = true;

    let cancelled = false;

    const initializeDraft = async () => {
      const currentParams = new URLSearchParams(searchParamString);
      const queryEnergyType = currentParams.get("energyType");
      const initialEnergyType = isEnergyType(queryEnergyType) ? queryEnergyType : DEFAULT_ENERGY_TYPE;
      const queryDraftId = currentParams.get("draftId")?.trim();
      let resolvedDraftId = queryDraftId || "";

      if (!resolvedDraftId) {
        try {
          const latestDraft = await fetchJsonWithFallback<DraftLatestResponse>(
            "/api/proposal/draft/latest",
            { method: "GET" }
          );
          resolvedDraftId = latestDraft?.data?.draftId?.trim() || "";
        } catch (error) {
          console.warn("Failed to load latest draft id", error);
        }
      }

      if (!resolvedDraftId) {
        resolvedDraftId = createDraftId();
      }

      setDraftId(resolvedDraftId);

      const nextParams = new URLSearchParams(currentParams);
      nextParams.set("draftId", resolvedDraftId);
      nextParams.set("energyType", initialEnergyType);
      if (nextParams.toString() !== currentParams.toString()) {
        setSearchParams(nextParams, { replace: true });
      }

      try {
        const draftResp = await fetchJsonWithFallback<DraftGetResponse>(
          `/api/proposal/draft?id=${encodeURIComponent(resolvedDraftId)}`,
          { method: "GET" }
        );

        if (cancelled) return;

        const serverDraft = draftResp?.data;
        if (serverDraft) {
          const resolvedEnergyType = isEnergyType(serverDraft.energyType)
            ? serverDraft.energyType
            : initialEnergyType;

          if (Array.isArray(serverDraft.coverages) && serverDraft.coverages.length > 0) {
            skipNextCoverageInitRef.current = true;
          }
          if (serverDraft.step) setCurrentStep(serverDraft.step);
          if (serverDraft.vehicle) {
            setVehicle({ ...serverDraft.vehicle, energyType: resolvedEnergyType });
          } else {
            setVehicle(prev => ({ ...prev, energyType: resolvedEnergyType }));
          }
          if (serverDraft.owner) setOwner(serverDraft.owner);
          if (serverDraft.proposer) setProposer(serverDraft.proposer);
          if (serverDraft.insured) setInsured(serverDraft.insured);
          setCoverages(mergePersistedCoverages(resolvedEnergyType, serverDraft.coverages));
          setEnergyType(resolvedEnergyType);
        } else {
          setEnergyType(initialEnergyType);
          setVehicle(prev => ({ ...prev, energyType: initialEnergyType }));
          initializeCoverages(initialEnergyType);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load cloud draft", error);
        setEnergyType(initialEnergyType);
        setVehicle(prev => ({ ...prev, energyType: initialEnergyType }));
        initializeCoverages(initialEnergyType);
      } finally {
        if (!cancelled) {
          setDraftBootstrapped(true);
        }
      }
    };

    initializeDraft();

    return () => {
      cancelled = true;
    };
  }, [searchParamString, setSearchParams]);

  // 自动保存草稿到 D1（不落本地）
  useEffect(() => {
    if (!draftBootstrapped || !draftId) return;

    if (draftSaveTimerRef.current) {
      window.clearTimeout(draftSaveTimerRef.current);
    }

    draftSaveTimerRef.current = window.setTimeout(async () => {
      const draftPayload: PersistedDraft = {
        step: currentStep,
        vehicle,
        owner,
        proposer,
        insured,
        coverages,
        energyType,
      };

      try {
        await fetchJsonWithFallback("/api/proposal/draft/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            draftId,
            data: draftPayload,
          }),
        });
      } catch (error) {
        console.error("Failed to save cloud draft", error);
      }
    }, 600);

    return () => {
      if (draftSaveTimerRef.current) {
        window.clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, [draftBootstrapped, draftId, currentStep, vehicle, owner, proposer, insured, coverages, energyType]);

  const buildCoveragesForEnergyType = (type: EnergyType): CoverageItem[] => {
    const applicableCoverages = getApplicableCoverages(type);

    return applicableCoverages.map(config => ({
      type: config.type,
      name: getCoverageName(config, type), // 根据能源类型获取正确的名称
      amount: config.amount,
      selected: false,
      required: config.required,
      parentType: config.parentType,
    }));
  };

  // Merge persisted coverages with the current config list:
  // - Drops removed/unknown types (e.g. legacy "compulsory")
  // - Ensures main coverages (damage/third_party/driver/passenger) always exist as candidates
  const mergePersistedCoverages = (type: EnergyType, persisted: unknown): CoverageItem[] => {
    const base = buildCoveragesForEnergyType(type);

    if (!Array.isArray(persisted)) return base;

    const byType = new Map<string, any>();
    for (const item of persisted) {
      if (!item || typeof item !== "object") continue;
      const coverageType = (item as any).type;
      if (typeof coverageType === "string" && coverageType.trim()) {
        byType.set(coverageType, item);
      }
    }

    return base.map(item => {
      const persistedItem = byType.get(item.type);
      if (!persistedItem) return item;

      const selected = typeof persistedItem.selected === "boolean"
        ? persistedItem.selected
        : Boolean(persistedItem.selected);

      const rawAmount = persistedItem.amount;
      const parsedAmount = typeof rawAmount === "number" ? rawAmount : Number(rawAmount);

      return {
        ...item,
        selected,
        amount: Number.isFinite(parsedAmount) ? parsedAmount : item.amount,
      };
    });
  };

  const initializeCoverages = (type: EnergyType) => {
    setCoverages(buildCoveragesForEnergyType(type));
  };

  // 当能源类型改变时重新初始化险种（简化：不需要复杂的 useEffect 逻辑）
  useEffect(() => {
    if (!energyType) return;
    if (skipNextCoverageInitRef.current) {
      skipNextCoverageInitRef.current = false;
      return;
    }
    initializeCoverages(energyType);
  }, [energyType]);

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
        policyEffectiveDate,
        vehicle,
        owner,
        proposer,
        insured,
        coverages: coverages.filter(c => c.selected),
      };

      // 调用 API 保存到 KV（核保端需要读取这个数据）
      // Use text/plain to avoid Preflight OPTIONS check (Simple Request)
      // Backend automatically parses JSON body regardless of Content-Type
      const result = await fetchJsonWithFallback<{ proposalId: string }>("/api/policy.salesman", {
        method: "POST",
        body: JSON.stringify(applicationData),
        headers: { "Content-Type": "text/plain" }
      });

      // 提交成功后跳转状态页
      navigate(`/status?id=${encodeURIComponent(result.proposalId)}`);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        // Debugging Info & Interactive Diagnosis
        const buildTime = "2026-02-10 22:50";
        const msg = `【网络请求被拦截】\n原因：${error.kind}\nURL: ${error.url}\n\n极大概率是 Cloudflare Access (Zero Trust) 拦截了 API。\n\n点击【确定】尝试在浏览器中直接打开 API 地址（验证是否出现登录页或由 Cloudflare 页面）。\n点击【取消】关闭。`;

        if (window.confirm(msg)) {
          window.open(error.url || "https://xinhexin-api.chinalife-shiexinhexin.workers.dev/api/policy.salesman", "_blank");
        }
      } else {
        alert(error instanceof Error ? error.message : "提交失败，请重试");
      }
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
                <SmartDateInput
                  value={vehicle.registerDate}
                  onChange={val => setVehicle({ ...vehicle, registerDate: val })}
                  placeholder="20230101"
                />
                <span className="text-gray-400 ml-2">›</span>
              </div>

              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-500">发证日期</span>
                <SmartDateInput
                  value={vehicle.issueDate}
                  onChange={val => setVehicle({ ...vehicle, issueDate: val })}
                  placeholder="20230101"
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
                      if (file) {
                        handleImageUpload(file, val => setVehicle({ ...vehicle, licenseImage: val }))
                          .catch(err => alert(`上传失败: ${err.message}`));
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )
        }


        {/* 车主信息 */}
        {
          currentStep === "owner" && (
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
                          if (file) {
                            handleImageUpload(file, val => setOwner({ ...owner, idImage: val }))
                              .catch(err => alert(`上传失败: ${err.message}`));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </>
          )
        }

        {/* 投保人信息 */}
        {
          currentStep === "proposer" && (
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
                          if (file) {
                            handleImageUpload(file, val => setProposer({ ...proposer, idImage: val }))
                              .catch(err => alert(`上传失败: ${err.message}`));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </>
          )
        }

        {/* 被保险人信息 */}
        {
          currentStep === "insured" && (
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
                            if (file) {
                              handleImageUpload(file, val => setInsured({ ...insured, idImage: val }))
                                .catch(err => alert(`上传失败: ${err.message}`));
                            }
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
          )
        }

        {/* 险种选择 */}
        {
          currentStep === "coverages" && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 space-y-3">
                {/* 起保日期选择 */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
                  <span className="text-sm font-bold text-gray-700">起保日期</span>
                  <input
                    type="date"
                    value={policyEffectiveDate}
                    onChange={e => setPolicyEffectiveDate(e.target.value)}
                    className="text-right text-sm outline-none text-emerald-600 font-medium bg-transparent"
                  />
                </div>

                <div className="pt-1">
                  <h4 className="text-xs font-bold text-gray-500 mb-2">主险</h4>
                </div>

                {coverages.filter(c => !c.parentType).map(coverage => (
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
          )
        }
      </main >

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
          const resolvedEnergyType = isEnergyType(app.energyType) ? app.energyType : DEFAULT_ENERGY_TYPE;

          // Prevent the energyType effect from overwriting imported selections.
          skipNextCoverageInitRef.current = true;

          if (app.vehicle) {
            setVehicle({ ...app.vehicle, energyType: resolvedEnergyType });
          } else {
            setVehicle(prev => ({ ...prev, energyType: resolvedEnergyType }));
          }
          setOwner(app.owner);
          setProposer(app.proposer);
          setInsured(app.insured);
          setCoverages(mergePersistedCoverages(resolvedEnergyType, app.coverages));
          setEnergyType(resolvedEnergyType);
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
    </div >
  );
};

export default ApplyForm;
