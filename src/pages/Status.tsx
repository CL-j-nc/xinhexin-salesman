import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;

function renderStatusUI(data: any) {
  switch (data.status) {
    case "UNDERWRITING":
    case "MANUAL_REVIEW":
      return (
        <div className="text-center space-y-4">
          <div className="animate-spin text-4xl">⏳</div>
          <div className="text-lg font-bold">正在核保中</div>
          <div className="text-sm text-gray-500">
            系统正在进行风险评估，请耐心等待
          </div>
        </div>
      );

    case "APPROVED":
      return (
        <div className="text-center space-y-4">
          <div className="text-4xl text-green-600">✅</div>
          <div className="text-lg font-bold">核保通过</div>
          <div>预计保费：¥ {data.premium}</div>
        </div>
      );

    case "ISSUED":
      return (
        <div className="text-center space-y-4">
          <div className="text-4xl text-green-600">🎉</div>
          <div className="text-lg font-bold">投保成功</div>
          <div>保单号：{data.policyNo}</div>
        </div>
      );

    case "REJECTED":
      return (
        <div className="text-center space-y-4">
          <div className="text-4xl text-red-500">❌</div>
          <div className="text-lg font-bold">核保未通过</div>
          <div className="text-sm text-gray-500">
            原因：{data.reason || "不符合承保规则"}
          </div>
        </div>
      );

    default:
      return (
        <div className="text-center space-y-4">
          <div className="text-4xl text-gray-400">⚠️</div>
          <div className="text-lg font-bold">系统异常</div>
        </div>
      );
  }
}

export default function Status() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const applicationNo = sessionStorage.getItem("applicationNo");
    if (!applicationNo) {
      setError("缺少申请单号");
      return;
    }

    let timer: number;

    const queryStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/underwriting/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationNo }),
        });

        if (!res.ok) throw new Error("查询失败");

        const json = await res.json();
        setData(json);

        // 终态停止轮询
        if (
          json.status === "ISSUED" ||
          json.status === "REJECTED"
        ) {
          clearInterval(timer);
        }
      } catch (e: any) {
        setError(e.message || "接口异常");
        clearInterval(timer);
      }
    };

    queryStatus();
    timer = window.setInterval(queryStatus, 5000);

    return () => clearInterval(timer);
  }, []);

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!data) {
    return <div className="p-6">核保中，请稍候…</div>;
  }

  return (
    <div className="p-6 min-h-screen">
      {renderStatusUI(data)}
    </div>
  );
}