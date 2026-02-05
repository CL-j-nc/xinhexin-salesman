import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../utils/cn";
import HomeHeader from "../components/HomeHeader";
import CRMExportImport from "../components/CRMExportImport";

const Apply: React.FC = () => {
  const navigate = useNavigate();
  const [showExportImport, setShowExportImport] = useState(false);

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

            {/* Query Entry - 核保进度查询 (包含多条件查询功能) */}
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
                <h3 className="text-xl font-bold text-slate-800">核保进度查询</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pl-1">
                查看投保进度 / 多条件搜索
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

            {/* CRM Data Management */}
            <div
              onClick={() => setShowExportImport(true)}
              role="button"
              tabIndex={0}
              className={cn(
                "module-glow module-glow-slate",
                "bg-gradient-to-br from-amber-50 to-white rounded-2xl p-8 shadow-md border-2 border-amber-200",
                "cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300",
                "active:scale-[0.98]"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-amber-500">
                  <path
                    d="M12 8h24a2 2 0 012 2v28a2 2 0 01-2 2H12a2 2 0 01-2-2V10a2 2 0 012-2z"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 16h16M16 24h16M16 32h10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M30 28l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="text-xl font-bold text-slate-700">CRM 数据管理</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed pl-1">
                导入/导出车辆客户档案
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CRM Export/Import Modal */}
      <CRMExportImport
        visible={showExportImport}
        onClose={() => setShowExportImport(false)}
      />
    </div>
  );
};

export default Apply;
