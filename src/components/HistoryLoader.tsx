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
    displacement: string;
    seats: string;
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
 * - 仅负责读取历史投保数据
 * - 将历史数据填充回 ApplyForm 表单
 * 
 * 数据来源（按优先级）：
 * 1. 通过 applicationId 从接口获取：GET /api/application/detail?id=xxx
 * 2. 从 localStorage 读取历史缓存
 * 
 * 使用场景：
 * - 核保退回（UR）后的再次修改投保
 * - 投保查询页中查看并复用历史投保信息
 * 
 * 严格禁止：
 * - ❌ 不允许导入后自动提交
 * - ❌ 不允许修改 status
 * - ❌ 不允许触发 underwriting / 核保
 * - ❌ 不允许在组件内做业务判断
 * - ❌ 不允许写 KV / Worker
 */
const HistoryLoader: React.FC<HistoryLoaderProps> = ({
  visible,
  onClose,
  applicationId,
  onLoad,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<ApplicationData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 从 localStorage 获取历史记录
  const loadFromLocalStorage = (): ApplicationData[] => {
    try {
      const stored = localStorage.getItem("insurance_applications");
      if (!stored) return [];
      
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("读取历史记录失败:", e);
      return [];
    }
  };

  // 从接口获取指定投保单详情
  const loadFromAPI = async (id: string): Promise<ApplicationData | null> => {
    try {
      const response = await fetch(`/api/application/detail?id=${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("获取投保详情失败");
      }

      const data = await response.json();
      return data;
    } catch (e: any) {
      console.error("从接口获取历史记录失败:", e);
      return null;
    }
  };

  // 加载历史记录
  useEffect(() => {
    if (!visible) return;

    const loadHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        // 优先级1：如果提供了 applicationId，从接口获取
        if (applicationId) {
          const apiData = await loadFromAPI(applicationId);
          if (apiData) {
            setHistoryList([apiData]);
            setSelectedId(apiData.id);
          } else {
            // 接口失败，降级到 localStorage
            const localData = loadFromLocalStorage();
            const matchedData = localData.find(item => item.id === applicationId);
            if (matchedData) {
              setHistoryList([matchedData]);
              setSelectedId(matchedData.id);
            } else {
              setError("未找到对应的投保记录");
            }
          }
        } else {
          // 优先级2：从 localStorage 获取所有历史记录
          const localData = loadFromLocalStorage();
          if (localData.length === 0) {
            setError("暂无历史投保记录");
          } else {
            setHistoryList(localData);
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
  const handleImport = () => {
    if (!selectedId) {
      alert("请先选择要导入的记录");
      return;
    }

    const selectedData = historyList.find(item => item.id === selectedId);
    if (!selectedData) {
      alert("未找到选中的记录");
      return;
    }

    // 调用父组件的 onLoad，仅填充表单字段
    // 不触发提交，不修改 status
    onLoad(selectedData);
    onClose();
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
                          {item.vehicle.plate || "未填写车牌"}
                        </span>
                        {item.status && (
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              item.status === "APPLIED"
                                ? "bg-blue-100 text-blue-700"
                                : item.status === "UI"
                                ? "bg-blue-100 text-blue-700"
                                : item.status === "UA"
                                ? "bg-green-100 text-green-700"
                                : item.status === "UR"
                                ? "bg-red-100 text-red-700"
                                : item.status === "PAID"
                                ? "bg-green-100 text-green-700"
                                : item.status === "ISSUED"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            )}
                          >
                            {item.status === "APPLIED"
                              ? "核保中"
                              : item.status === "UI"
                              ? "核保中"
                              : item.status === "UA"
                              ? "核保通过"
                              : item.status === "UR"
                              ? "退回修改"
                              : item.status === "PAID"
                              ? "已支付"
                              : item.status === "ISSUED"
                              ? "已承保"
                              : item.status}
                          </span>
                        )}
                      </div>

                      {/* 车辆信息 */}
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>品牌：{item.vehicle.brand || "未填写"}</div>
                        <div>
                          车型：{item.energyType === "NEV" ? "新能源" : "燃油车"}
                        </div>
                        <div>
                          使用性质：{item.vehicle.useNature || "未填写"}
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

export default HistoryLoader;
