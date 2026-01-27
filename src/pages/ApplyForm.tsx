import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../utils/cn";
import type { EnergyType } from "../utils/codec";
import Header from "../components/Header";
import DocumentTypePopup from "../components/DocumentTypePopup";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// --- 新增 API 接口函数 ---
async function apiParseVehicle(data: {
  plate?: string;
  vin?: string;
}) {
  const res = await fetch(`${API_BASE}/api/vehicle/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("车辆解析失败");
  return res.json();
}

async function apiFetchCoverages(energyType: EnergyType) {
  const res = await fetch(
    `${API_BASE}/api/coverage/list?energyType=${energyType}`
  );
  if (!res.ok) throw new Error("险种加载失败");
  return res.json();
}

async function apiCalcPremium(payload: {
  vehicle: VehicleInfo;
  owner: PersonInfo;
  insured: PersonInfo;
  coverages: CoverageItem[];
}) {
  const res = await fetch(`${API_BASE}/api/premium/calc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("保费试算失败");
  return res.json();
}

type Step = "vehicle" | "owner" | "proposer" | "insured" | "coverages";

interface PersonInfo {
  name: string;
  idType: string;
  idCard: string;
  mobile: string;
  address: string;
  idImage: string;
  identityType: "individual" | "enterprise";
  principalName?: string;
  principalIdCard?: string;
  principalAddress?: string;
  principalIdImage?: string;
}

interface VehicleInfo {
  plate: string;
  vin: string;
  engineNo: string;
  brand: string;
  registerDate: string;
  useNature: string;
  energyType: EnergyType;
  licenseImage: string;
}

interface CoverageItem {
  type: string;
  level?: string;
  addon?: boolean;
}

// Bottom Sheet Component
interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, title, children }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full bg-white rounded-t-2xl shadow-2xl animate-sheet-up max-h-[70vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const ApplyForm: React.FC = () => {
  const navigate = useNavigate();
  const [energyType, setEnergyType] = useState<EnergyType>("FUEL");
  const [currentStep, setCurrentStep] = useState<Step>("proposer");
  const [isSameAsProposer, setIsSameAsProposer] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Color scheme based on energy type
  const isNEV = energyType === "NEV";
  const bgClass = isNEV
    ? "bg-gradient-to-b from-emerald-50 via-emerald-50/30 to-white"
    : "bg-[#f7f9fc]";
  const headerClass = isNEV
    ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
    : "bg-emerald-500";
  const activeTabClass = isNEV
    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md"
    : "bg-emerald-500 text-white shadow-md";

  // Form state
  const [proposer, setProposer] = useState<PersonInfo>({
    name: "",
    idType: "居民身份证",
    idCard: "",
    mobile: "",
    address: "",
    idImage: "",
    identityType: "individual",
    principalName: "",
    principalIdCard: "",
    principalAddress: "",
    principalIdImage: "",
  });

  const [owner, setOwner] = useState<PersonInfo>({
    name: "",
    idType: "居民身份证",
    idCard: "",
    mobile: "",
    address: "",
    idImage: "",
    identityType: "individual",
  });

  const [insured, setInsured] = useState<PersonInfo>({
    name: "",
    idType: "居民身份证",
    idCard: "",
    mobile: "",
    address: "",
    idImage: "",
    identityType: "individual",
    principalName: "",
    principalIdCard: "",
    principalAddress: "",
    principalIdImage: "",
  });

  const [vehicle, setVehicle] = useState<VehicleInfo>({
    plate: "",
    vin: "",
    engineNo: "",
    brand: "",
    registerDate: "",
    useNature: "家庭自用",
    energyType: "FUEL",
    licenseImage: "",
  });

  const [coverages, setCoverages] = useState<CoverageItem[]>([]);

  // 险种列表 options
  const [coverageOptions, setCoverageOptions] = useState<any[]>([]);
  // 拉取险种列表
  useEffect(() => {
    apiFetchCoverages(energyType)
      .then(setCoverageOptions)
      .catch(() => { });
  }, [energyType]);

  // Bottom sheet state
  const [showCoverageSheet, setShowCoverageSheet] = useState(false);
  const [selectedCoverageType, setSelectedCoverageType] = useState<string>("");

  // Document type popup state
  const [showDocumentPopup, setShowDocumentPopup] = useState(false);
  const [documentFor, setDocumentFor] = useState<"proposer" | "insured" | "owner" | "proposer-principal" | "insured-principal" | "owner-principal">("proposer");

  useEffect(() => {
    const stored = sessionStorage.getItem("energyType");
    if (stored === "NEV" || stored === "FUEL") {
      setEnergyType(stored);
      setVehicle(prev => ({ ...prev, energyType: stored }));
    } else {
      navigate("/");
    }
  }, [navigate]);

  const steps: { id: Step; label: string }[] = [
    { id: "vehicle", label: "承保车辆信息" },
    { id: "owner", label: "车主信息" },
    { id: "proposer", label: "投保人信息" },
    { id: "insured", label: "被保险人信息" },
    { id: "coverages", label: "险种" },
  ];

  const idTypes = ["居民身份证", "统一社会信用代码", "护照"];
  const useNatures = ["家庭自用", "营运", "非营运"];

  // Image upload helper
  const handleImageUpload = async (
    file: File,
    setter: (value: string) => void
  ) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setter(base64);
        resolve();
      };
      reader.onerror = () => reject(new Error("图片读取失败"));
      reader.readAsDataURL(file);
    });
  };

  const handleNext = () => {
    if (currentStep === "vehicle") {
      setCurrentStep("owner");
    } else if (currentStep === "owner") {
      setCurrentStep("proposer");
    } else if (currentStep === "proposer") {
      setCurrentStep("insured");
    } else if (currentStep === "insured") {
      if (isSameAsProposer) {
        setInsured({
          name: proposer.name,
          idType: proposer.idType,
          idCard: proposer.idCard,
          mobile: proposer.mobile,
          address: proposer.address,
          idImage: proposer.idImage,
          identityType: proposer.identityType,
        });
      }
      setCurrentStep("coverages");
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === "insured") setCurrentStep("proposer");
    else if (currentStep === "proposer") setCurrentStep("owner");
    else if (currentStep === "owner") setCurrentStep("vehicle");
    else if (currentStep === "vehicle") navigate(-1);
    else if (currentStep === "coverages") setCurrentStep("insured");
    else navigate(-1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        proposer,
        insured: isSameAsProposer ? proposer : insured,
        owner,
        vehicle,
        coverages,
      };

      const res = await fetch(`${API_BASE}/api/application/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "提交失败");
      }

      alert("投保申请提交成功！");
      navigate("/status");
    } catch (err: any) {
      alert("提交失败: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openCoverageSelector = (type: string) => {
    setSelectedCoverageType(type);
    setShowCoverageSheet(true);
  };

  const selectCoverageLevel = (level: string) => {
    setCoverages(prev => {
      const exists = prev.find(c => c.type === selectedCoverageType);
      if (exists) {
        return prev.map(c =>
          c.type === selectedCoverageType ? { ...c, level } : c
        );
      } else {
        return [...prev, { type: selectedCoverageType, level }];
      }
    });
    setShowCoverageSheet(false);
  };

  const toggleAddon = (type: string) => {
    setCoverages(prev => {
      const exists = prev.find(c => c.type === type);
      if (exists) {
        return prev.filter(c => c.type !== type);
      } else {
        return [...prev, { type, addon: true }];
      }
    });
  };

  const getCoverageLevel = (type: string) => {
    return coverages.find(c => c.type === type)?.level || "";
  };

  const hasAddon = (type: string) => {
    return coverages.some(c => c.type === type && c.addon);
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col font-sans animate-page-enter",
      isNEV
        ? "bg-gradient-to-b from-emerald-500 via-emerald-300 to-white"
        : "bg-[#f7f9fc]"
    )}>
      {/* Header */}
      <Header
        energyType={energyType}
        title="承保信息填写"
        showBackButton={true}
        onBackClick={handleBack}
      />

      {/* Tabs */}
      <div className={cn(
        "px-4 py-2 flex gap-2 sticky top-[52px] z-30 shadow-sm",
        isNEV ? "bg-emerald-50/80 backdrop-blur-sm" : "bg-white"
      )}>
        {steps.map(step => (
          <button
            key={step.id}
            type="button"
            onClick={() => setCurrentStep(step.id)}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
              currentStep === step.id
                ? activeTabClass
                : "bg-gray-50 text-gray-400"
            )}
          >
            {step.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <main className="flex-1 p-4 overflow-y-auto pb-24">
        {/* Proposer Step */}
        {currentStep === "proposer" && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4 animate-page-enter">
            <h3 className="text-sm font-bold text-gray-800 mb-4">投保人信息</h3>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">主体属性</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    checked={proposer.identityType === "individual"}
                    onChange={() => setProposer({ ...proposer, identityType: "individual" })}
                    className="accent-emerald-500"
                  />
                  个人
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    checked={proposer.identityType === "enterprise"}
                    onChange={() => setProposer({ ...proposer, identityType: "enterprise" })}
                    className="accent-emerald-500"
                  />
                  单位
                </label>
              </div>
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">投保人名称</span>
              <input
                value={proposer.name}
                onChange={e => setProposer({ ...proposer, name: e.target.value })}
                placeholder="请输入投保人名称"
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div
              className="flex items-center border-b border-gray-50 py-3 cursor-pointer active:bg-gray-50"
              onClick={() => {
                setDocumentFor("proposer");
                setShowDocumentPopup(true);
              }}
            >
              <span className="w-24 text-gray-500 text-sm">证件类型</span>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm">{proposer.idType}</span>
                <span className="text-gray-400">›</span>
              </div>
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">证件号码</span>
              <input
                value={proposer.idCard}
                onChange={e => setProposer({ ...proposer, idCard: e.target.value })}
                placeholder="请输入证件号码"
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">联系电话</span>
              <input
                value={proposer.mobile}
                onChange={e => setProposer({ ...proposer, mobile: e.target.value })}
                placeholder="请输入手机号"
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">通讯地址</span>
              <input
                value={proposer.address}
                onChange={e => setProposer({ ...proposer, address: e.target.value })}
                placeholder="请输入地址"
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div className="border-b border-gray-50 py-3">
              <span className="block text-gray-500 text-sm mb-2">证件照片</span>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file, (base64) =>
                      setProposer({ ...proposer, idImage: base64 })
                    );
                  }
                }}
                className="text-sm"
              />
              {proposer.idImage && (
                <div className="mt-2 text-xs text-emerald-600">✓ 已上传</div>
              )}
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">被代理人姓名</span>
              <input
                value={proposer.principalName || ""}
                onChange={e => setProposer({ ...proposer, principalName: e.target.value })}
                placeholder="选填"
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">被代理人证件号</span>
              <input
                value={proposer.principalIdCard || ""}
                onChange={e => setProposer({ ...proposer, principalIdCard: e.target.value })}
                placeholder="选填"
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">被代理人地址</span>
              <input
                value={proposer.principalAddress || ""}
                onChange={e => setProposer({ ...proposer, principalAddress: e.target.value })}
                placeholder="选填"
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div className="border-b border-gray-50 py-3">
              <span className="block text-gray-500 text-sm mb-2">被代理人证件照</span>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file, (base64) =>
                      setProposer({ ...proposer, principalIdImage: base64 })
                    );
                  }
                }}
                className="text-sm"
              />
              {proposer.principalIdImage && (
                <div className="mt-2 text-xs text-emerald-600">✓ 已上传</div>
              )}
            </div>

            {/* Legal Person Info for Enterprise */}
            {proposer.identityType === "enterprise" && (
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-bold text-gray-800">法人/企业负责人信息</h4>

                <div className="flex items-center border-b border-gray-50 py-3">
                  <span className="w-24 text-gray-500 text-sm">姓名</span>
                  <input
                    value={proposer.principalName || ""}
                    onChange={e => setProposer({ ...proposer, principalName: e.target.value })}
                    placeholder="请输入法人姓名"
                    className="flex-1 outline-none text-sm"
                  />
                </div>

                <div className="flex items-center border-b border-gray-50 py-3">
                  <span className="w-24 text-gray-500 text-sm">证件号码</span>
                  <input
                    value={proposer.principalIdCard || ""}
                    onChange={e => setProposer({ ...proposer, principalIdCard: e.target.value })}
                    placeholder="请输入法人证件号码"
                    className="flex-1 outline-none text-sm"
                  />
                </div>

                <div className="flex items-center border-b border-gray-50 py-3">
                  <span className="w-24 text-gray-500 text-sm">联系地址</span>
                  <input
                    value={proposer.principalAddress || ""}
                    onChange={e => setProposer({ ...proposer, principalAddress: e.target.value })}
                    placeholder="请输入法人地址"
                    className="flex-1 outline-none text-sm"
                  />
                </div>

                <div className="border-b border-gray-50 py-3">
                  <span className="block text-gray-500 text-sm mb-2">证件照片</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file, (base64) =>
                          setProposer({ ...proposer, principalIdImage: base64 })
                        );
                      }
                    }}
                    className="text-sm"
                  />
                  {proposer.principalIdImage && (
                    <div className="mt-2 text-xs text-emerald-600">✓ 已上传</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Insured Step */}
        {currentStep === "insured" && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4 animate-page-enter">
            <h3 className="text-sm font-bold text-gray-800 mb-4">被保险人信息</h3>

            <div className="flex items-center justify-between mb-6 py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">是否与投保人一致</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    checked={!isSameAsProposer}
                    onChange={() => setIsSameAsProposer(false)}
                    className="accent-emerald-500"
                  />
                  否
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    checked={isSameAsProposer}
                    onChange={() => setIsSameAsProposer(true)}
                    className="accent-emerald-500"
                  />
                  是
                </label>
              </div>
            </div>

            {!isSameAsProposer && (
              <div className="space-y-4">
                <div className="flex items-center border-b border-gray-50 py-3">
                  <span className="w-24 text-gray-500 text-sm">主体属性</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="radio"
                        checked={insured.identityType === "individual"}
                        onChange={() => setInsured({ ...insured, identityType: "individual" })}
                        className="accent-emerald-500"
                      />
                      个人
                    </label>
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="radio"
                        checked={insured.identityType === "enterprise"}
                        onChange={() => setInsured({ ...insured, identityType: "enterprise" })}
                        className="accent-emerald-500"
                      />
                      单位
                    </label>
                  </div>
                </div>

                <div className="flex items-center border-b border-gray-50 py-3">
                  <span className="w-24 text-gray-500 text-sm">被保险人名称</span>
                  <input
                    value={insured.name}
                    onChange={e => setInsured({ ...insured, name: e.target.value })}
                    placeholder="请输入被保险人名称"
                    className="flex-1 outline-none text-sm"
                  />
                </div>

                <div
                  className="flex items-center border-b border-gray-50 py-3 cursor-pointer active:bg-gray-50"
                  onClick={() => {
                    setDocumentFor("insured");
                    setShowDocumentPopup(true);
                  }}
                >
                  <span className="w-24 text-gray-500 text-sm">证件类型</span>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm">{insured.idType}</span>
                    <span className="text-gray-400">›</span>
                  </div>
                </div>

                <div className="flex items-center border-b border-gray-50 py-3">
                  <span className="w-24 text-gray-500 text-sm">证件号码</span>
                  <input
                    value={insured.idCard}
                    onChange={e => setInsured({ ...insured, idCard: e.target.value })}
                    placeholder="请输入证件号码"
                    className="flex-1 outline-none text-sm"
                  />
                </div>

                <div className="flex items-center border-b border-gray-50 py-3">
                  <span className="w-24 text-gray-500 text-sm">联系电话</span>
                  <input
                    value={insured.mobile}
                    onChange={e => setInsured({ ...insured, mobile: e.target.value })}
                    placeholder="请输入手机号"
                    className="flex-1 outline-none text-sm"
                  />
                </div>

                <div className="flex items-center border-b border-gray-50 py-3">
                  <span className="w-24 text-gray-500 text-sm">通讯地址</span>
                  <input
                    value={insured.address}
                    onChange={e => setInsured({ ...insured, address: e.target.value })}
                    placeholder="请输入地址"
                    className="flex-1 outline-none text-sm"
                  />
                </div>

                <div className="border-b border-gray-50 py-3">
                  <span className="block text-gray-500 text-sm mb-2">证件照片</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file, (base64) =>
                          setInsured({ ...insured, idImage: base64 })
                        );
                      }
                    }}
                    className="text-sm"
                  />
                  {insured.idImage && (
                    <div className="mt-2 text-xs text-emerald-600">✓ 已上传</div>
                  )}
                </div>

                {/* Legal Person Info for Enterprise */}
                {insured.identityType === "enterprise" && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-bold text-gray-800">法人/企业负责人信息</h4>

                    <div className="flex items-center border-b border-gray-50 py-3">
                      <span className="w-24 text-gray-500 text-sm">姓名</span>
                      <input
                        value={insured.principalName || ""}
                        onChange={e => setInsured({ ...insured, principalName: e.target.value })}
                        placeholder="请输入法人姓名"
                        className="flex-1 outline-none text-sm"
                      />
                    </div>

                    <div className="flex items-center border-b border-gray-50 py-3">
                      <span className="w-24 text-gray-500 text-sm">证件号码</span>
                      <input
                        value={insured.principalIdCard || ""}
                        onChange={e => setInsured({ ...insured, principalIdCard: e.target.value })}
                        placeholder="请输入法人证件号码"
                        className="flex-1 outline-none text-sm"
                      />
                    </div>

                    <div className="flex items-center border-b border-gray-50 py-3">
                      <span className="w-24 text-gray-500 text-sm">联系地址</span>
                      <input
                        value={insured.principalAddress || ""}
                        onChange={e => setInsured({ ...insured, principalAddress: e.target.value })}
                        placeholder="请输入法人地址"
                        className="flex-1 outline-none text-sm"
                      />
                    </div>

                    <div className="border-b border-gray-50 py-3">
                      <span className="block text-gray-500 text-sm mb-2">证件照片</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file, (base64) =>
                              setInsured({ ...insured, principalIdImage: base64 })
                            );
                          }
                        }}
                        className="text-sm"
                      />
                      {insured.principalIdImage && (
                        <div className="mt-2 text-xs text-emerald-600">✓ 已上传</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isSameAsProposer && (
              <div className="text-center py-8 text-gray-400 text-sm">
                被保险人与投保人为同一人
              </div>
            )}
          </div>
        )}

        {/* Vehicle Step */}
        {currentStep === "vehicle" && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4 animate-page-enter">
            <div className="flex items-center justify-between mb-6">
              <div className={cn(
                "px-3 py-1 rounded text-sm font-bold",
                isNEV ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
              )}>
                {isNEV ? "新能源汽车" : "燃油车"}
              </div>
              <div className="w-20 h-12 bg-slate-100 rounded flex items-center justify-center text-2xl">
                {isNEV ? "⚡" : "🚗"}
              </div>
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">车牌号</span>
              <input
                value={vehicle.plate}
                onChange={e => setVehicle({ ...vehicle, plate: e.target.value.toUpperCase() })}
                placeholder="请输入车牌号"
                className="flex-1 outline-none text-sm"
                onBlur={async () => {
                  // 原有逻辑不变，追加接口调用
                  if (vehicle.plate || vehicle.vin) {
                    try {
                      const data = await apiParseVehicle({
                        plate: vehicle.plate,
                        vin: vehicle.vin,
                      });
                      setVehicle(prev => ({
                        ...prev,
                        brand: data.brand ?? prev.brand,
                        engineNo: data.engineNo ?? prev.engineNo,
                      }));
                    } catch { }
                  }
                }}
              />
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">车架号</span>
              <input
                value={vehicle.vin}
                onChange={e => setVehicle({ ...vehicle, vin: e.target.value.toUpperCase() })}
                placeholder="请输入VIN"
                className="flex-1 outline-none text-sm"
                onBlur={async () => {
                  // 原有逻辑不变，追加接口调用
                  if (vehicle.plate || vehicle.vin) {
                    try {
                      const data = await apiParseVehicle({
                        plate: vehicle.plate,
                        vin: vehicle.vin,
                      });
                      setVehicle(prev => ({
                        ...prev,
                        brand: data.brand ?? prev.brand,
                        engineNo: data.engineNo ?? prev.engineNo,
                      }));
                    } catch { }
                  }
                }}
              />
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">发动机号</span>
              <input
                value={vehicle.engineNo}
                onChange={e => setVehicle({ ...vehicle, engineNo: e.target.value })}
                placeholder="请输入发动机号"
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">品牌型号</span>
              <input
                value={vehicle.brand}
                onChange={e => setVehicle({ ...vehicle, brand: e.target.value })}
                placeholder="请输入品牌型号"
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">注册日期</span>
              <input
                type="date"
                value={vehicle.registerDate}
                onChange={e => setVehicle({ ...vehicle, registerDate: e.target.value })}
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">使用性质</span>
              <select
                value={vehicle.useNature}
                onChange={e => setVehicle({ ...vehicle, useNature: e.target.value })}
                className="flex-1 outline-none text-sm bg-transparent"
              >
                {useNatures.map(nature => (
                  <option key={nature} value={nature}>{nature}</option>
                ))}
              </select>
            </div>

            <div className="border-b border-gray-50 py-3">
              <span className="block text-gray-500 text-sm mb-2">行驶证照片</span>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file, (base64) =>
                      setVehicle({ ...vehicle, licenseImage: base64 })
                    );
                  }
                }}
                className="text-sm"
              />
              {vehicle.licenseImage && (
                <div className="mt-2 text-xs text-emerald-600">✓ 已上传</div>
              )}
            </div>
          </div>
        )}

        {/* Owner Step */}
        {currentStep === "owner" && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4 animate-page-enter">
            <h3 className="text-sm font-bold text-gray-800 mb-4">车主信息</h3>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">主体属性</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    checked={owner.identityType === "individual"}
                    onChange={() => setOwner({ ...owner, identityType: "individual" })}
                    className="accent-emerald-500"
                  />
                  个人
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    checked={owner.identityType === "enterprise"}
                    onChange={() => setOwner({ ...owner, identityType: "enterprise" })}
                    className="accent-emerald-500"
                  />
                  单位
                </label>
              </div>
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">车主名称</span>
              <input
                value={owner.name}
                onChange={e => setOwner({ ...owner, name: e.target.value })}
                placeholder="请输入车主名称"
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div
              className="flex items-center border-b border-gray-50 py-3 cursor-pointer active:bg-gray-50"
              onClick={() => {
                setDocumentFor("owner");
                setShowDocumentPopup(true);
              }}
            >
              <span className="w-24 text-gray-500 text-sm">证件类型</span>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm">{owner.idType}</span>
                <span className="text-gray-400">›</span>
              </div>
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">证件号码</span>
              <input
                value={owner.idCard}
                onChange={e => setOwner({ ...owner, idCard: e.target.value })}
                placeholder="请输入证件号码"
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">联系电话</span>
              <input
                value={owner.mobile}
                onChange={e => setOwner({ ...owner, mobile: e.target.value })}
                placeholder="请输入手机号"
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div className="flex items-center border-b border-gray-50 py-3">
              <span className="w-24 text-gray-500 text-sm">联系地址</span>
              <input
                value={owner.address}
                onChange={e => setOwner({ ...owner, address: e.target.value })}
                placeholder="请输入地址"
                className="flex-1 outline-none text-sm"
              />
            </div>

            <div className="border-b border-gray-50 py-3">
              <span className="block text-gray-500 text-sm mb-2">证件照片</span>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file, (base64) =>
                      setOwner({ ...owner, idImage: base64 })
                    );
                  }
                }}
                className="text-sm"
              />
              {owner.idImage && (
                <div className="mt-2 text-xs text-emerald-600">✓ 已上传</div>
              )}
            </div>

            {/* Legal Person Info for Enterprise */}
            {owner.identityType === "enterprise" && (
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-bold text-gray-800">法人/企业负责人信息</h4>

                <div className="flex items-center border-b border-gray-50 py-3">
                  <span className="w-24 text-gray-500 text-sm">投保人名称</span>
                  <input
                    value={owner.principalName || ""}
                    onChange={e => setOwner({ ...owner, principalName: e.target.value })}
                    placeholder="请输入法人姓名"
                    className="flex-1 outline-none text-sm"
                  />
                </div>

                <div className="flex items-center border-b border-gray-50 py-3">
                  <span className="w-24 text-gray-500 text-sm">证件号码</span>
                  <input
                    value={owner.principalIdCard || ""}
                    onChange={e => setOwner({ ...owner, principalIdCard: e.target.value })}
                    placeholder="请输入法人证件号码"
                    className="flex-1 outline-none text-sm"
                  />
                </div>

                <div className="flex items-center border-b border-gray-50 py-3">
                  <span className="w-24 text-gray-500 text-sm">联系地址</span>
                  <input
                    value={owner.principalAddress || ""}
                    onChange={e => setOwner({ ...owner, principalAddress: e.target.value })}
                    placeholder="请输入法人地址"
                    className="flex-1 outline-none text-sm"
                  />
                </div>

                <div className="border-b border-gray-50 py-3">
                  <span className="block text-gray-500 text-sm mb-2">证件照片</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file, (base64) =>
                          setOwner({ ...owner, principalIdImage: base64 })
                        );
                      }
                    }}
                    className="text-sm"
                  />
                  {owner.principalIdImage && (
                    <div className="mt-2 text-xs text-emerald-600">✓ 已上传</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Coverages Step */}
        {currentStep === "coverages" && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4 animate-page-enter">
            <h3 className="text-sm font-bold text-gray-800 mb-4">险种选择</h3>

            {/* Third Party Liability */}
            <div
              onClick={() => openCoverageSelector("third_party")}
              className="flex items-center justify-between border-b border-gray-50 py-3 cursor-pointer active:bg-gray-50"
            >
              <span className="text-sm text-gray-700">商业三者险</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm",
                  getCoverageLevel("third_party") ? "text-emerald-600 font-bold" : "text-gray-400"
                )}>
                  {getCoverageLevel("third_party") || "请选择"}
                </span>
                <span className="text-gray-400">›</span>
              </div>
            </div>

            {/* Vehicle Damage */}
            <div
              onClick={() => openCoverageSelector("damage")}
              className="flex items-center justify-between border-b border-gray-50 py-3 cursor-pointer active:bg-gray-50"
            >
              <span className="text-sm text-gray-700">车辆损失险</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm",
                  getCoverageLevel("damage") ? "text-emerald-600 font-bold" : "text-gray-400"
                )}>
                  {getCoverageLevel("damage") || "请选择"}
                </span>
                <span className="text-gray-400">›</span>
              </div>
            </div>

            {/* NEV Add-ons */}
            {isNEV && (
              <>
                <div className="pt-4 pb-2">
                  <h4 className="text-xs font-bold text-gray-500">新能源汽车附加险</h4>
                </div>

                <label className="flex items-center justify-between border-b border-gray-50 py-3 cursor-pointer">
                  <span className="text-sm text-gray-700">三电/电池损失险</span>
                  <input
                    type="checkbox"
                    checked={hasAddon("battery")}
                    onChange={() => toggleAddon("battery")}
                    className="w-5 h-5 accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between border-b border-gray-50 py-3 cursor-pointer">
                  <span className="text-sm text-gray-700">外部电网故障损失险</span>
                  <input
                    type="checkbox"
                    checked={hasAddon("charging")}
                    onChange={() => toggleAddon("charging")}
                    className="w-5 h-5 accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between border-b border-gray-50 py-3 cursor-pointer">
                  <span className="text-sm text-gray-700">自用充电桩损失险</span>
                  <input
                    type="checkbox"
                    checked={hasAddon("charging_pile")}
                    onChange={() => toggleAddon("charging_pile")}
                    className="w-5 h-5 accent-emerald-500"
                  />
                </label>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer Button */}
      <div className="p-4 bg-white border-t border-gray-100 fixed bottom-0 left-0 right-0">
        <button
          type="button"
          onClick={handleNext}
          disabled={submitting}
          className={cn(
            "w-full text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-50",
            isNEV
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
              : "bg-emerald-500"
          )}
        >
          {submitting ? "提交中..." : currentStep === "coverages" ? "提交投保" : "下一步"}
        </button>
      </div>

      {/* Bottom Sheet for Coverage Selection */}
      <BottomSheet
        visible={showCoverageSheet}
        onClose={() => setShowCoverageSheet(false)}
        title="选择保额"
      >
        <div className="space-y-3">
          {["50万", "100万", "150万", "200万", "300万", "500万", "1000万"].map(level => (
            <button
              key={level}
              type="button"
              onClick={() => selectCoverageLevel(level)}
              className={cn(
                "w-full py-3 px-4 rounded-lg text-sm font-medium transition-all",
                getCoverageLevel(selectedCoverageType) === level
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Document Type Popup */}
      <DocumentTypePopup
        visible={showDocumentPopup}
        onClose={() => setShowDocumentPopup(false)}
        onSelect={(type) => {
          switch (documentFor) {
            case "proposer":
              setProposer({ ...proposer, idType: type });
              break;
            case "owner":
              setOwner({ ...owner, idType: type });
              break;
            case "insured":
              setInsured({ ...insured, idType: type });
              break;
            default:
              break;
          }
        }}
        currentValue={
          documentFor === "proposer" ? proposer.idType :
            documentFor === "owner" ? owner.idType :
              documentFor === "insured" ? insured.idType : ""
        }
      />
    </div>
  );
};

export default ApplyForm;

// 保费试算：coverages step 时监听 coverages 变化
useEffect(() => {
  if (currentStep === "coverages" && coverages.length > 0) {
    apiCalcPremium({
      vehicle,
      owner,
      insured: isSameAsProposer ? proposer : insured,
      coverages,
    }).catch(() => { });
  }
}, [coverages, currentStep]);