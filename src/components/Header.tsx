import React from "react";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title = "新核心车险承保信息页面",
  showBackButton = false,
  onBackClick,
}) => {
  return (
    <header className="px-4 py-3 flex items-center gap-3 sticky top-0 z-40 bg-white border-b border-slate-100">
      {showBackButton && (
        <button type="button" onClick={onBackClick} className="text-xl">
          ←
        </button>
      )}

      <img
        src="/logo-a.png"
        alt="Logo"
        className="h-7 w-auto object-contain"
      />
      <h1 className="text-base font-bold text-slate-800">{title}</h1>
    </header>
  );
};

export default Header;
