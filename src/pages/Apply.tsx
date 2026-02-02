import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../utils/cn";
import HomeHeader from "../components/HomeHeader";

const Apply: React.FC = () => {
  const navigate = useNavigate();

  const handleEnergySelection = (energyType: "NEV" | "FUEL") => {
    sessionStorage.setItem("energyType", energyType);
    navigate("/apply");
  };

  return (
    <div className="min-h-screen page-enter">
      {/* Standardized Header */}
      <HomeHeader />

      {/* Main Content - Entry Cards */}
      <div className="max-w-5xl mx-auto px-6 pt-4 relative z-20">
        {/* Vehicle Insurance Section */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-slate-600 mb-4 px-2">机动车营运投保通道</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* FUEL Entry */}
            <div
              onClick={() => handleEnergySelection("FUEL")}
              role="button"
              tabIndex={0}
              className={cn(
                "module-glow module-glow-emerald",
                "bg-white rounded-2xl p-8 shadow-lg cursor-pointer transition-all duration-300",
                "hover:shadow-2xl hover:-translate-y-1 border-2 border-slate-200",
                "active:scale-[0.98] group"
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {/* Geometric Car Icon - Line Art Style */}
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-slate-700">
                      <path
                        d="M8 26h32M10 20l2-6h24l2 6M12 30a2 2 0 100-4 2 2 0 000 4zM36 30a2 2 0 100-4 2 2 0 000 4zM8 26v6a2 2 0 002 2h28a2 2 0 002-2v-6"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 20v-2M32 20v-2"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <h3 className="text-xl font-bold text-slate-800">燃油车</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed pl-1">
                    传统机动车辆承保通道
                  </p>
                </div>
                <div className="text-5xl font-thin text-emerald-600 group-hover:text-emerald-700 transition-colors">
                  +
                </div>
              </div>
            </div>

            {/* Query Entry */}
            <div
              onClick={() => navigate("/status")}
              role="button"
              tabIndex={0}
              className={cn(
                "module-glow module-glow-blue",
                "bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-8 shadow-lg cursor-pointer transition-all duration-300",
                "hover:shadow-2xl hover:-translate-y-1 border-2 border-emerald-200",
                "active:scale-[0.98]"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                {/* Geometric Search Icon - Line Art Style */}
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-emerald-600">
                  <circle
                    cx="20"
                    cy="20"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M27 27l9 9"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M20 15v10M15 20h10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <h3 className="text-xl font-bold text-slate-800">新核心承保系统</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pl-1">
                投核保信息查询
              </p>
            </div>
          </div>
        </div>

        {/* NEV Section */}
        <div className="mb-12">
          <h2 className="text-base font-bold text-slate-600 mb-4 px-2">新能源汽车投保通道</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* NEV Entry */}
            <div
              onClick={() => handleEnergySelection("NEV")}
              role="button"
              tabIndex={0}
              className={cn(
                "module-glow module-glow-emerald-strong",
                "bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-8 shadow-lg cursor-pointer transition-all duration-300",
                "hover:shadow-2xl hover:-translate-y-1 border-2 border-emerald-400",
                "active:scale-[0.98] group"
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {/* Geometric Electric Car Icon - Line Art Style */}
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-white">
                      <path
                        d="M8 26h32M10 20l2-6h24l2 6M12 30a2 2 0 100-4 2 2 0 000 4zM36 30a2 2 0 100-4 2 2 0 000 4zM8 26v6a2 2 0 002 2h28a2 2 0 002-2v-6"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M20 16l-2 4h4l-2 4M28 16l-2 4h4l-2 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <h3 className="text-xl font-bold text-white">新能源</h3>
                  </div>
                  <p className="text-sm text-emerald-50 leading-relaxed pl-1">
                    电动、混动车辆专属通道
                  </p>
                </div>
                <div className="text-5xl font-thin text-white group-hover:text-emerald-100 transition-colors">
                  +
                </div>
              </div>
            </div>

            {/* System Permissions Placeholder */}
            <div
              className={cn(
                "module-glow module-glow-slate",
                "bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 shadow-md border-2 border-slate-200",
                "opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                {/* Geometric Shield Icon - Line Art Style */}
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-slate-400">
                  <path
                    d="M24 6L10 12v10c0 8.8 6 17 14 20 8-3 14-11.2 14-20V12L24 6z"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 24l4 4 8-8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="text-xl font-bold text-slate-400">系统权限</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed pl-1">
                管理员功能入口
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Apply;
