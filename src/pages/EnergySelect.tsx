import React from "react";
import { useNavigate } from "react-router-dom";

const options = [
  {
    key: "NEV",
    title: "新能源车投保",
    coverage: "新能源专属险",
    tone: "emerald",
    cardBg: "bg-emerald-50",
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
    cardBg: "bg-stone-50",
    border: "border-stone-200/80",
    button: "bg-slate-700 hover:bg-slate-800",
    chip: "text-slate-700 bg-white border border-stone-200",
    description: "适用于传统燃油货车或营运客车。",
  },
];

const EnergySelect: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-stone-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="text-center">
          <h1
            className="text-2xl font-semibold text-slate-900 md:text-3xl"
            style={{ fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif' }}
          >
            欢迎登录好投保后台人寿财险新核心承保系统，请选择您的车辆能源类型
          </h1>
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-emerald-100 bg-white/80 px-6 py-4 text-sm text-slate-700 shadow-sm">
            <p className="font-medium text-emerald-700">温馨提示</p>
            <p className="mt-2">
              本流程仅支持货车或营运客车投保，请投保前与您的企业保险顾问确认您的投保资格
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          {options.map((item) => (
            <div
              key={item.key}
              className={`relative overflow-hidden rounded-3xl border ${item.border} ${item.cardBg} p-8 shadow-sm`}
            >
              <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/70" />
              <div className="relative space-y-5">
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${item.chip}`}>
                  车型支持
                </div>
                <h2
                  className="text-2xl font-semibold text-slate-900"
                  style={{ fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif' }}
                >
                  {item.title}
                </h2>
                <p
                  className="text-sm text-slate-600"
                  style={{ fontFamily: '"Noto Sans SC", "Source Han Sans SC", sans-serif' }}
                >
                  {item.description}
                </p>
                <div className="rounded-2xl bg-white/90 p-4 text-sm text-slate-700 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Coverage
                  </p>
                  <p className="mt-2 text-base font-semibold">{item.coverage}</p>
                </div>
                <button
                  onClick={() => navigate(`/apply/form?energy=${item.key}`)}
                  className={`w-full rounded-2xl px-6 py-3 text-sm font-semibold text-white transition ${item.button}`}
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
