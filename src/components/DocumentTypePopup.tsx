import React from "react";
import { cn } from "../utils/cn";

interface DocumentTypePopupProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
  currentValue?: string;
}

const DocumentTypePopup: React.FC<DocumentTypePopupProps> = ({ 
  visible, 
  onClose, 
  onSelect, 
  currentValue 
}) => {
  if (!visible) return null;

  const documentTypes = [
    { value: "居民身份证", label: "居民身份证", icon: "🆔" },
    { value: "营业执照", label: "营业执照", icon: "🏢" },
    { value: "护照", label: "护照", icon: "🛂" },
    { value: "军人证", label: "军人证", icon: "🎖️" },
    { value: "统一社会信用代码", label: "统一社会信用代码", icon: "🏛️" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
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
        <div className="p-3">
          <div className="space-y-2">
            {documentTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  onSelect(type.value);
                  onClose();
                }}
                className={cn(
                  "w-full p-3 rounded-xl text-left transition-all duration-200",
                  "border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50",
                  currentValue === type.value 
                    ? "bg-emerald-100 border-emerald-300" 
                    : "bg-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <div className="font-medium text-sm text-gray-800">
                      {type.label}
                    </div>
                  </div>
                  {currentValue === type.value && (
                    <div className="ml-auto w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
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

export default DocumentTypePopup;