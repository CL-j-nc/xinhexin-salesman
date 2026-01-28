import React, { useState } from "react";
import { cn } from "../utils/cn";

interface UseNatureSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  currentValue?: string;
}

/**
 * 车辆使用性质选择器
 * 
 * 严格枚举：仅允许以下 5 个选项（不得增减）
 * - 出租营业客车
 * - 预约出租客运
 * - 租赁营业客车
 * - 营业货车
 * - 非营业货车
 * 
 * 功能：仅作为投保数据字段随 /api/save 提交
 * 
 * 严格禁止：
 * - ❌ 不写 status
 * - ❌ 不触发 underwriting
 * - ❌ 不联动支付/核保流程
 * - ❌ 不引入任何后端 API
 */
const UseNatureSelector: React.FC<UseNatureSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  currentValue,
}) => {
  const [showTip, setShowTip] = useState(false);

  if (!visible) return null;

  // 唯一允许的选项（一字不差，不得增减）
  const ALLOWED_OPTIONS = [
    "出租营业客车",
    "预约出租客运",
    "租赁营业客车",
    "营业货车",
    "非营业货车",
  ];

  // 提示文案（必须出现）
  const TIP_TEXT = "仅支持出租（含预约出租客运）营业客车、租赁营业客车、营业货车和非营业货车进行投保登记。";

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
          <h3 className="text-base font-bold text-gray-800">车辆使用性质</h3>
          <div className="flex items-center gap-2">
            {/* 提示按钮（必须出现） */}
            <button
              type="button"
              onClick={() => setShowTip(!showTip)}
              className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-blue-600 transition-colors"
              aria-label="查看提示"
            >
              ?
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 提示信息（点击问号后显示） */}
        {showTip && (
          <div className="mx-4 mt-3 p-3 bg-gray-800 text-white text-sm rounded-lg relative animate-slide-down">
            <div className="absolute -top-2 right-12 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-800"></div>
            {TIP_TEXT}
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <div className="space-y-2">
            {ALLOWED_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onSelect(option);
                  onClose();
                }}
                className={cn(
                  "w-full p-4 rounded-xl text-left transition-all duration-200",
                  "border hover:border-emerald-200 hover:bg-emerald-50",
                  currentValue === option
                    ? "bg-emerald-100 border-emerald-300"
                    : "bg-white border-gray-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        currentValue === option
                          ? "text-emerald-700"
                          : "text-gray-800"
                      )}
                    >
                      {option}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      支持
                    </span>
                  </div>
                  {currentValue === option && (
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
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
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
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

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
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

        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UseNatureSelector;
