import React, { useState, useEffect } from "react";
import { cn } from "../utils/cn";

/**
 * 投保数据结构（与 ApplyForm 保持一致）
 */
interface ApplicationData {
  id: string;
  timestamp: number;
  energyType: "FUEL" | "NEV";
  vehicle: {
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
    curbWeight: string;  // 整备质量
    approvedLoad: string;  // 核定载质量
    seats: string;
    energyType: "FUEL" | "NEV";  // 与 ApplyForm 保持一致
    licenseImage: string;
  };
  owner: any;
  proposer: any;
  insured: any;
  coverages: any[];
  status?: string;
}

interface HistoryLoaderProps {
  visible: boolean;
  onClose: () => void;
  applicationId?: string;
  onLoad: (data: ApplicationData) => void;
}

/**
 * HistoryLoader - 投保历史记录引用 / 一键导入组件
 * 
 * 组件定位：
 * - 纯前端数据引用组件
 * - 仅负责读取历史投保数据（通过 API）
 * - 将历史数据填充回 ApplyForm 表单
 * 
 * 数据来源：
 * - 唯一来源：通过 API 从 Cloudflare D1 获取
 * - GET /api/proposal/detail?id=xxx 获取新版投保详情
 * - GET /api/application/detail?id=xxx 获取旧版投保详情
 * - GET /api/application/history 获取统一历史列表
 */
const HistoryLoader: React.FC<HistoryLoaderProps> = ({
  visible,
  onClose,
  applicationId,
  onLoad,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 从接口获取指定投保单详情 (New Proposal)
  const loadProposalDetail = async (id: string): Promise<ApplicationData | null> => {
    try {
      const response = await fetch(`/api/proposal/detail?id=${id}`, { method: "GET" });
      if (!response.ok) throw new Error("获取详情失败");
      const { data } = await response.json(); // data is the saved JSON payload
      // data: { vehicle, owner, proposer, insured, coverages, energyType }
      if (!data) return null;

      return {
        id,
        timestamp: Date.now(),
        energyType: data.energyType,
        vehicle: data.vehicle,
        owner: data.owner,
        proposer: data.proposer,
        insured: data.insured,
        coverages: data.coverages,
        status: "Unknown"
      };
    } catch (e: any) {
      console.error("Failed to load proposal detail", e);
      return null;
    }
  }

  // 从接口获取指定投保单详情 (Legacy)
  const loadLegacyDetail = async (id: string): Promise<ApplicationData | null> => {
    try {
      const response = await fetch(`/api/application/detail?id=${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("获取投保详情失败");
      }

      const res = await response.json();
      const data = res.data;
      if (!data) return null;

      return {
        id,
        timestamp: 0,
        energyType: data.vehicle?.energyType || "FUEL",
        vehicle: data.vehicle,
        owner: data.owner,
        proposer: data.proposer,
        insured: data.insured,
        coverages: data.coverages || [],
        status: res.status
      };
    } catch (e: any) {
      console.error("从接口获取历史记录失败:", e);
      return null;
    }
  };

  // 从接口获取历史投保列表 (Unified)
  const loadHistoryList = async (): Promise<any[]> => {
    try {
      const response = await fetch(`/api/application/history`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("获取历史投保列表失败");
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (e: any) {
      console.error("从接口获取历史投保列表失败:", e);
      return [];
    }
  };

  // 加载历史记录
  useEffect(() => {
    if (!visible) return;

    const loadHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        if (applicationId) {
          if (applicationId.startsWith("PROP")) {
            const d = await loadProposalDetail(applicationId);
            if (d) {
              // Adapt data for list display
              const displayItem = {
                id: d.id,
                timestamp: d.timestamp,
                status: "CURRENT",
                energyType: d.energyType,
                plate: d.vehicle?.plate,
                brand: d.vehicle?.brand,
                vehicle_type: d.vehicle?.vehicleType
              };
              setHistoryList([displayItem]);
              setSelectedId(d.id);
            } else setError("未找到记录");
          } else {
            const d = await loadLegacyDetail(applicationId);
            if (d) {
              const displayItem = {
                id: d.id,
                timestamp: d.timestamp,
                status: d.status,
                energyType: d.energyType,
                plate: d.vehicle?.plate,
                brand: d.vehicle?.brand,
                vehicle_type: d.vehicle?.vehicleType
              };
              setHistoryList([displayItem]);
              setSelectedId(d.id);
            } else setError("未找到记录");
          }
        } else {
          // Normal mode: Load list
          const historyData = await loadHistoryList();
          if (historyData.length === 0) {
            setError("暂无历史投保记录");
          } else {
            setHistoryList(historyData);
          }
        }
      } catch (e: any) {
        setError(e.message || "加载历史记录失败");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [visible, applicationId]);

  // 一键导入
  const handleImport = async () => {
    if (!selectedId) {
      alert("请先选择要导入的记录");
      return;
    }

    setLoading(true);
    try {
      let fullData: ApplicationData | null = null;
      if (selectedId.startsWith("PROP")) {
        fullData = await loadProposalDetail(selectedId);
      } else {
        fullData = await loadLegacyDetail(selectedId);
      }

      if (!fullData) {
        alert("无法获取该记录的完整详情");
        return;
      }

      onLoad(fullData);
      onClose();
    } catch (e) {
      alert("导入失效");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />

      {/* 弹出卡片 */}
      <div className="relative w-full bg-white rounded-t-2xl shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
          <h3 className="text-base font-bold text-gray-800">历史投保记录</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* 加载中 */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <div className="text-sm text-gray-500">加载中...</div>
            </div>
          )}

          {/* 错误提示 */}
          {!loading && error && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 text-gray-300">📋</div>
              <div className="text-sm text-gray-500">{error}</div>
            </div>
          )}

          {/* 历史记录列表 */}
          {!loading && !error && historyList.length > 0 && (
            <div className="space-y-3">
              {historyList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "w-full p-4 rounded-xl text-left transition-all duration-200 border",
                    selectedId === item.id
                      ? "bg-emerald-50 border-emerald-300"
                      : "bg-white border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* 车牌号 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={cn(
                            "text-base font-bold",
                            selectedId === item.id
                              ? "text-emerald-700"
                              : "text-gray-800"
                          )}
                        >
                          {item.plate || "未填写车牌"}
                        </span>
                        {item.status && (
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              getStatusColor(item.status)
                            )}
                          >
                            {getStatusText(item.status)}
                          </span>
                        )}
                      </div>

                      {/* 车辆信息 */}
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>品牌：{item.brand || "未填写"}</div>
                        <div>
                          车型：{item.energyType === "NEV" ? "新能源" : "燃油车"}
                        </div>
                      </div>

                      {/* 时间戳 */}
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(item.timestamp).toLocaleString("zh-CN")}
                      </div>
                    </div>

                    {/* 选中标识 */}
                    {selectedId === item.id && (
                      <div className="ml-4">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer - 一键导入按钮 */}
        {!loading && !error && historyList.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
            <button
              type="button"
              onClick={handleImport}
              disabled={!selectedId}
              className={cn(
                "w-full py-3 rounded-xl font-bold transition-all",
                selectedId
                  ? "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              一键导入历史投保信息
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

function getStatusColor(status?: string) {
  switch (status) {
    case "SUBMITTED":
    case "APPLIED":
    case "UI":
      return "bg-blue-100 text-blue-700";
    case "UA":
    case "APPROVED":
    case "PAID":
    case "ISSUED":
      return "bg-green-100 text-green-700";
    case "UR":
    case "REJECTED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusText(status?: string) {
  switch (status) {
    case "SUBMITTED": return "已提交";
    case "APPLIED": return "核保中";
    case "UI": return "核保中";
    case "UA": return "核保通过";
    case "APPROVED": return "核保通过";
    case "UR": return "退回修改";
    case "REJECTED": return "已拒保";
    case "PAID": return "已支付";
    case "ISSUED": return "已承保";
    default: return status || "未知";
  }
}

export default HistoryLoader;
