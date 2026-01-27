import React from "react";
import { cn } from "../utils/cn";

interface HeaderProps {
  energyType?: "FUEL" | "NEV";
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  energyType = "FUEL", 
  title = "新核心车险承保系统",
  showBackButton = false,
  onBackClick
}) => {
  const isNEV = energyType === "NEV";
  
  return (
    <header className={cn(
      "text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40",
      isNEV 
        ? "bg-gradient-to-r from-emerald-500 to-emerald-600" 
        : "bg-emerald-500"
    )}>
      {showBackButton && (
        <button 
          type="button" 
          onClick={onBackClick}
          className="text-xl"
        >
          ←
        </button>
      )}
      
      <div className="flex items-center gap-3">
        {/* China Life Property Insurance Logo */}
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <span className="text-emerald-600 font-bold text-xs">中寿</span>
        </div>
        
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      
      <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center text-xs">
        {isNEV ? "⚡" : "🚗"}
      </div>
    </header>
  );
};

export default Header;