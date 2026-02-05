import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 状态显示文案映射
const STATUS_TEXT_MAP: Record<string, string> = {
  APPLIED: "投保成功",
  SUBMITTED: "已提交",
  UI: "核保中",
  UA: "核保通过",
  UR: "退回修改",
  PAID: "已支付",
  ISSUED: "已承保",
  REJECTED: "已拒保",
};

// 状态图标映射
const STATUS_ICON_MAP: Record<string, string> = {
  APPLIED: "✅",
  UI: "⏳",
  UA: "✅",
  UR: "⚠️",
  PAID: "💳",
  ISSUED: "📋",
};

// 状态颜色映射
const STATUS_COLOR_MAP: Record<string, string> = {
  APPLIED: "text-emerald-600",
  UI: "text-blue-600",
  UA: "text-emerald-600",
  UR: "text-orange-600",
  PAID: "text-emerald-600",
  ISSUED: "text-emerald-600",
};

export default function Status() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const applicationId = sessionStorage.getItem("applicationId");

    if (!applicationId) {
      setError("缺少申请单号");
      setLoading(false);
      return;
    }

    let timer: number;

    // ==================== 核心轮询逻辑：只读取 status ====================
    const queryStatus = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(`${API_BASE_URL}/api/proposal/status?id=${applicationId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("查询失败");

        const data = await res.json();

        setStatus(data.status);
        setReason(data.reason || "");
        setLoading(false);

        // 终态停止轮询：PAID 或 ISSUED
        if (data.status === "PAID" || data.status === "ISSUED" || data.status === "REJECTED") {
          clearInterval(timer);
        }
      } catch (e: any) {
        setError(e.message || "接口异常");
        setLoading(false);
        clearInterval(timer);
      }
    };

    queryStatus();
    timer = window.setInterval(queryStatus, 5000); // 每5秒轮询一次

    return () => clearInterval(timer);
  }, []);

  // 错误处理
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <div className="text-lg font-bold text-red-600">{error}</div>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="animate-spin text-4xl">⏳</div>
          <div className="text-lg font-bold text-gray-700">查询中...</div>
        </div>
      </div>
    );
  }

  // 状态为空（未找到）
  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-4xl text-gray-400">📋</div>
          <div className="text-lg font-bold text-gray-700">未找到投保记录</div>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 显示状态
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-2xl mx-auto pt-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center space-y-6">
            {/* 状态图标 */}
            <div className={`text-6xl ${STATUS_ICON_MAP[status] ? "" : "animate-spin"}`}>
              {STATUS_ICON_MAP[status] || "⏳"}
            </div>

            {/* 状态文字 */}
            <div className={`text-2xl font-bold ${STATUS_COLOR_MAP[status] || "text-gray-700"}`}>
              {STATUS_TEXT_MAP[status] || status}
            </div>

            {/* 退回原因（仅在UR状态显示） */}
            {status === "UR" && reason && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <div className="text-sm font-bold text-red-800 mb-2">退回原因：</div>
                <div className="text-sm text-red-700">{reason}</div>
              </div>
            )}

            {/* 状态说明 */}
            <div className="text-sm text-gray-600 mt-4 leading-relaxed">
              {status === "APPLIED" ? (
                <p>✨ 投保申请已成功提交！<br />系统已将您的申请转入核保审核，请耐心等待</p>
              ) : status === "UI" ? (
                <p>⏳ 核保中<br />系统正在进行风险评估，请耐心等待</p>
              ) : status === "UA" ? (
                <p>🎉 恭喜您！您的投保申请已通过核保<br />现在可以前往支付完成投保</p>
              ) : status === "UR" ? (
                <p>⚠️ 您的投保申请需要修改后重新提交</p>
              ) : status === "PAID" ? (
                <p>✅ 支付成功，系统正在生成保单</p>
              ) : status === "ISSUED" ? (
                <p>🎊 保单已生成，恭喜您承保成功！</p>
              ) : null}
            </div>

            {/* 按钮区域 */}
            <div className="mt-8 space-y-3">
              {/* 核保通过后显示支付按钮 */}
              {status === "UA" && (
                <button
                  onClick={() => alert("跳转支付页面（待对接）")}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  前往支付
                </button>
              )}

              {/* 退回修改后显示重新提交按钮 */}
              {status === "UR" && (
                <button
                  onClick={() => navigate("/apply")}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  重新提交
                </button>
              )}

              {/* 返回首页按钮 */}
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="text-center text-xs text-gray-400 mt-6">
          <p>申请单号：{sessionStorage.getItem("applicationId")}</p>
          <p className="mt-2">系统每5秒自动刷新状态</p>
        </div>
      </div>
    </div>
  );
}
