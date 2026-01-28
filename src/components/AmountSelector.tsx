import React from "react";
import { cn } from "../utils/cn";

interface AmountSelectorProps {
  visible: boolean;
  onClose: () => void;
  type: string;
  currentAmount?: number;
  onSelect: (amount: number) => void;
}

const AmountSelector: React.FC<AmountSelectorProps> = ({
  visible,
  onClose,
  type,
  currentAmount,
  onSelect,
}) => {
  if (!visible) return null;

  // 根据类型定义可选金额
  const getAmountOptions = () => {
    if (type === "third_party") {
      // 三者险金额选项
      return [
        { value: 500000, label: "50万" },
        { value: 1000000, label: "100万" },
        { value: 2000000, label: "200万" },
        { value: 3000000, label: "300万" },
        { value: 5000000, label: "500万" },
        { value: 8000000, label: "800万" },
        { value: 10000000, label: "1000万" },
      ];
    } else if (type === "driver" || type === "passenger") {
      // 驾乘险金额选项
      return [
        { value: 10000, label: "1万" },
        { value: 20000, label: "2万" },
        { value: 30000, label: "3万" },
        { value: 50000, label: "5万" },
        { value: 100000, label: "10万" },
        { value: 200000, label: "20万" },
        { value: 300000, label: "30万" },
        { value: 400000, label: "40万" },
        { value: 500000, label: "50万" },
      ];
    }
    return [];
  };

  const options = getAmountOptions();

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />

      {/* 弹出卡片 */}
      <div className="relative w-full bg-white rounded-t-2xl shadow-2xl animate-slide-up max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
          <h3 className="text-base font-bold text-gray-800">选择保额</h3>
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
          <div className="space-y-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option.value);
                  onClose();
                }}
                className={cn(
                  "w-full p-4 rounded-xl text-left transition-all duration-200",
                  "border hover:border-emerald-200 hover:bg-emerald-50",
                  currentAmount === option.value
                    ? "bg-emerald-100 border-emerald-300"
                    : "bg-white border-gray-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-base font-medium",
                      currentAmount === option.value
                        ? "text-emerald-700"
                        : "text-gray-800"
                    )}
                  >
                    {option.label}
                  </span>
                  {currentAmount === option.value && (
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

export default AmountSelector;
