import React from "react";
import { useNavigate } from "react-router-dom";

const options = [
  {
    key: "NEV",
    title: "新能源车投保",
    coverage: "新能源专属险",
    tone: "emerald",
    cardBg: "bg-white",
    border: "border-emerald-200/80",
    button: "bg-emerald-600 hover:bg-emerald-700",
    chip: "text-emerald-700 bg-emerald-100",
    description: "适用于新能源货车或营运客车。",
  },
  {
    key: "FUEL",
    title: "燃油车投保",
    coverage: "燃油车商业险",
    tone: "stone",
    cardBg: "bg-white",
    border: "border-stone-200/80",
    button: "bg-emerald-600 hover:bg-emerald-700",
    chip: "text-slate-700 bg-white border border-stone-200",
    description: "适用于传统燃油货车或营运客车。",
  },
];

const EnergySelect: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8">
        <header className="space-y-4">
          <div className="rounded-md bg-emerald-600 px-4 py-3 text-center text-white">
            <h1
              className="text-lg font-semibold md:text-xl"
              style={{ fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif' }}
            >
              欢迎登录好投保后台人寿财险新核心承保系统，请选择您的车辆能源类型
            </h1>
          </div>
          <div className="rounded-md border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-emerald-700">温馨提示</p>
            <p className="mt-1">
              本流程仅支持货车或营运客车投保，请投保前与您的企业保险顾问确认您的投保资格
            </p>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          {options.map((item) => (
            <div
              key={item.key}
              className={`rounded-md border ${item.border} ${item.cardBg} p-5 shadow-sm`}
            >
              <div className="space-y-3">
                <h2
                  className="text-lg font-semibold text-slate-900"
                  style={{ fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif' }}
                >
                  {item.title}
                </h2>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="text-xs text-slate-500">Coverage</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{item.coverage}</p>
                </div>
                <button
                  onClick={() => navigate(`/apply/form?energy=${item.key}`)}
                  className={`w-full rounded-md px-4 py-3 text-base font-semibold text-white transition ${item.button}`}
                >
                  进入承保信息录入
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default EnergySelect;
