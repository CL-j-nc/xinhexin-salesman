import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";

import { EnergyType, InsuranceData } from "../utils/codec";
import { cn } from "../utils/cn";

const API_BASE = "https://xinhexin-api.chinalife-shiexinhexin.workers.dev";

const STEPS = [
  { id: "vehicle", label: "车辆" },
  { id: "owner", label: "车主" },
  { id: "proposer", label: "投保人" },
  { id: "insured", label: "被保险人" },
  { id: "coverages", label: "险种" },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type ApplicationStatus =
  | "APPLIED"
  | "UNDERWRITING"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "COMPLETED"
  | null;

const statusMap: Record<string, string> = {
  APPLIED: "已提交",
  UNDERWRITING: "核保中",
  APPROVED: "核保通过",
  REJECTED: "核保拒绝",
  PAID: "已支付",
  COMPLETED: "已完成",
};

const resolveEnergyType = (search: string): EnergyType => {
  const param = new URLSearchParams(search).get("energy");
  if (!param) return "NEV";
  const normalized = param.toUpperCase();
  if (normalized === "NEV") return "NEV";
  if (normalized === "FUEL" || normalized === "ICE") return "FUEL";
  return "NEV";
};

const Salesman: React.FC = () => {
  const location = useLocation();
  const energyType = useMemo(
    () => resolveEnergyType(location.search),
    [location.search]
  );
  const isNev = energyType === "NEV";

  const [currentStep, setCurrentStep] = useState<StepId>("vehicle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<ApplicationStatus>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);

  const { handleSubmit, watch, setValue } = useForm<InsuranceData>({
    defaultValues: {
      proposer: {
        name: "",
        idType: "居民身份证",
        idCard: "",
        mobile: "",
        address: "",
        idImage: "",
        idFront: null,
        idBack: null,
      },
      insured: {
        name: "",
        idType: "居民身份证",
        idCard: "",
        mobile: "",
        address: "",
        idImage: "",
        idFront: null,
        idBack: null,
      },
      vehicle: {
        plate: "",
        vin: "",
        engineNo: "",
        brand: "",
        registerDate: "",
        energyType,
        licenseFront: null,
        licenseBack: null,
      },
      coverages: [],
    },
  });

  useEffect(() => {
    setValue("vehicle.energyType", energyType);
  }, [energyType, setValue]);

  useEffect(() => {
    const cached = sessionStorage.getItem("salesmanRequestId");
    if (cached) {
      setRequestId(cached);
      pollStatus(cached);
    }
  }, []);

  useEffect(() => {
    if (requestId) sessionStorage.setItem("salesmanRequestId", requestId);
  }, [requestId]);

  useEffect(() => {
    if (status === "COMPLETED") {
      sessionStorage.removeItem("salesmanRequestId");
    }
  }, [status]);

  useEffect(() => {
    if (
      requestId &&
      !["APPROVED", "REJECTED", "PAID", "COMPLETED"].includes(status || "")
    ) {
      const id = setInterval(() => pollStatus(requestId), 3000);
      return () => clearInterval(id);
    }
    return undefined;
  }, [requestId, status]);

  useEffect(() => {
    let active = true;
    const buildQr = async () => {
      if (!qrPayload) {
        setQrImage(null);
        return;
      }

      if (qrPayload.startsWith("data:image") || qrPayload.startsWith("http")) {
        setQrImage(qrPayload);
        return;
      }

      if (/^[A-Za-z0-9+/=]+$/.test(qrPayload) && qrPayload.length > 80) {
        setQrImage(`data:image/png;base64,${qrPayload}`);
        return;
      }

      try {
        const dataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 220 });
        if (active) setQrImage(dataUrl);
      } catch (error) {
        console.error("二维码生成失败");
      }
    };

    buildQr();
    return () => {
      active = false;
    };
  }, [qrPayload]);

  const pollStatus = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/application/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status || null);
      if (data.qr) setQrPayload(data.qr);
      if (data.status === "COMPLETED") {
        setQrPayload(null);
        setQrImage(null);
      }
    } catch { }
  };

  const uploadFile = async (file: File | string | null): Promise<string | null> => {
    if (!file) return null;
    if (typeof file === "string") return file;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: formData });
    if (!res.ok) throw new Error("文件上传失败");
    const { fileId } = await res.json();
    return fileId;
  };

  const onSubmit = async (data: InsuranceData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      data.vehicle.energyType = energyType;

      const idFront = await uploadFile(data.proposer.idFront ?? null);
      if (data.proposer.idFront && !idFront) throw new Error("身份证正面上传失败");
      data.proposer.idFront = idFront || "";

      const idBack = await uploadFile(data.proposer.idBack ?? null);
      if (data.proposer.idBack && !idBack) throw new Error("身份证反面上传失败");
      data.proposer.idBack = idBack || "";

      const licenseFront = await uploadFile(data.vehicle.licenseFront ?? null);
      if (data.vehicle.licenseFront && !licenseFront) throw new Error("行驶证正面上传失败");
      data.vehicle.licenseFront = licenseFront || "";

      const licenseBack = await uploadFile(data.vehicle.licenseBack ?? null);
      if (data.vehicle.licenseBack && !licenseBack) throw new Error("行驶证反面上传失败");
      data.vehicle.licenseBack = licenseBack || "";

      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({
          ...data,
          applyType: energyType === "NEV" ? "EVACI" : "VACI",
          vehicleType: energyType === "NEV" ? "EV" : "ICE",
          channel: "salesman",
        })
      );

      const res = await fetch(`${API_BASE}/api/application/apply`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("提交失败");
      const payload = await res.json().catch(() => ({}));
      const nextId =
        payload.requestId ||
        payload.id ||
        payload.applicationId ||
        payload.applicationNo;

      if (!nextId) throw new Error("提交成功但未返回查询编号");
      setRequestId(nextId);
      pollStatus(nextId);

      alert("已提交，正在核保...");
    } catch (err: any) {
      alert(err.message || "提交失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonText = () => {
    if (isSubmitting) return "处理中...";
    if (status === "APPROVED") return "核保通过";
    if (status === "REJECTED") return "退回修改";
    if (status === "PAID") return "已支付";
    if (status === "COMPLETED") return "投保完成";
    if (currentStep === "coverages") return "提交核保";
    return "下一步";
  };

  const isButtonDisabled = () => {
    return isSubmitting || ["APPROVED", "PAID", "COMPLETED"].includes(status || "");
  };

  const renderStepContent = () => {
    const selectedClass = isNev
      ? "bg-emerald-500 text-white border-emerald-500"
      : "bg-slate-700 text-white border-slate-700";
    const unselectedClass = isNev
      ? "bg-white border-gray-200 hover:border-emerald-500"
      : "bg-white border-gray-200 hover:border-slate-500";

    switch (currentStep) {
      case "coverages":
        return (
          <div className="space-y-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {isNev ? "新能源专属险" : "燃油车商业险"}
              </p>
              <h3 className="mt-2 text-lg font-bold text-gray-900">第三者责任险</h3>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {[10, 20, 50, 100, 150, 200].map((amount) => (
                  <motion.button
                    key={amount}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setValue("coverages", [{ type: "thirdParty", amount }])}
                    className={cn(
                      "rounded-lg border py-3 text-center text-sm font-medium transition-all",
                      watch("coverages")?.[0]?.type === "thirdParty" &&
                        watch("coverages")?.[0]?.amount === amount
                        ? selectedClass
                        : unselectedClass
                    )}
                  >
                    {amount}万
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">车上人员责任险 (驾驶员)</h3>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {[1, 2, 5, 10, 20].map((amount) => (
                  <motion.button
                    key={amount}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setValue("coverages", [{ type: "driverLiability", amount }])
                    }
                    className={cn(
                      "rounded-lg border py-3 text-center text-sm font-medium transition-all",
                      watch("coverages")?.[0]?.type === "driverLiability" &&
                        watch("coverages")?.[0]?.amount === amount
                        ? selectedClass
                        : unselectedClass
                    )}
                  >
                    {amount}万
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-gray-600">
            {currentStep} 步骤内容
          </div>
        );
    }
  };

  const statusLabel = status ? statusMap[status] || status : "";
  const statusBadge =
    status === "APPROVED"
      ? isNev
        ? "bg-emerald-100 text-emerald-800"
        : "bg-slate-100 text-slate-800"
      : status === "REJECTED"
        ? "bg-rose-100 text-rose-800"
        : "bg-amber-100 text-amber-800";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
        <button className="text-2xl font-bold" type="button">
          ×
        </button>
        <h1 className="text-lg font-bold">
          {isNev ? "新能源车承保录入" : "燃油车承保录入"}
        </h1>
        <button className="text-2xl" type="button">
          ⋯
        </button>
      </header>

      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 text-white",
          isNev ? "bg-emerald-500" : "bg-slate-700"
        )}
      >
        <button className="text-2xl" type="button">
          ←
        </button>
        <h2 className="text-lg font-bold">报价信息填写</h2>
        <button className="text-2xl" type="button">
          ◎
        </button>
      </div>

      <div className="border-b border-gray-200 bg-white">
        <div className="flex whitespace-nowrap px-4">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={cn(
                "flex-1 px-6 py-3 text-center text-sm font-medium transition-colors",
                currentStep === step.id
                  ? isNev
                    ? "border-b-2 border-emerald-600 bg-emerald-50/30 text-emerald-600"
                    : "border-b-2 border-slate-600 bg-slate-50 text-slate-700"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {status && (
        <div className="mx-4 mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">核保状态</p>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusBadge)}>
              {statusLabel}
            </span>
          </div>
          <div className="mt-4 flex flex-col items-center gap-3">
            {status === "COMPLETED" && (
              <p className="text-sm text-slate-500">二维码已失效，状态已完成。</p>
            )}
            {status !== "COMPLETED" && qrImage && (
              <>
                <img
                  src={qrImage}
                  alt="投保二维码"
                  className="h-44 w-44 rounded-xl border border-slate-100 bg-white p-2"
                />
                <p className="text-xs text-slate-500">
                  二维码仅可使用一次，支付完成后自动失效。
                </p>
              </>
            )}
            {status !== "COMPLETED" && !qrImage && (
              <p className="text-sm text-slate-500">二维码暂未生成。</p>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 p-4 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4 shadow-lg">
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isButtonDisabled()}
          className={cn(
            "w-full rounded-xl py-4 text-lg font-bold text-white shadow-md transition-all",
            isButtonDisabled()
              ? "cursor-not-allowed bg-gray-400"
              : isNev
                ? "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700"
                : "bg-slate-700 hover:bg-slate-800 active:bg-slate-900"
          )}
        >
          {getButtonText()}
        </button>
      </footer>
    </div>
  );
};

export default Salesman;
