import React from "react";
import { cn } from "../utils/cn";

interface DocumentTypePopupProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
  currentValue?: string;
}

/**
 * 证件类型选择器
 * 
 * 纯UI组件：仅负责证件类型选择
 * 
 * 常见证件类型：
 * - 居民身份证
 * - 护照
 * - 军官证
 * - 港澳台居民居住证
 * - 统一社会信用代码
 */
const DocumentTypePopup: React.FC<DocumentTypePopupProps> = ({
  visible,
  onClose,
  onSelect,
  currentValue,
}) => {
  if (!visible) return null;

  const documentTypes = [
    "居民身份证",
    "护照",
    "军官证",
    "士兵证",
    "港澳居民来往内地通行证",
    "台湾居民来往大陆通行证",
    "港澳台居民居住证",
    "外国人永久居留身份证",
    "统一社会信用代码",
    "营业执照",
  ];

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
          <h3 className="text-base font-bold text-gray-800">选择证件类型</h3>
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
            {documentTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onSelect(type);
                  onClose();
                }}
                className={cn(
                  "w-full p-4 rounded-xl text-left transition-all duration-200",
                  "border hover:border-emerald-200 hover:bg-emerald-50",
                  currentValue === type
                    ? "bg-emerald-100 border-emerald-300"
                    : "bg-white border-gray-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      currentValue === type
                        ? "text-emerald-700"
                        : "text-gray-800"
                    )}
                  >
                    {type}
                  </span>
                  {currentValue === type && (
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
    </div >
  );
};

export default DocumentTypePopup;
