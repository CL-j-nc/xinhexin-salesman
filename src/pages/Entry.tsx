import React from "react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    title: "投保意愿申请",
    description: "提交投保意愿，进入核保准备流程。",
    to: "/apply",
    accent: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    border: "border-emerald-200/70",
  },
  {
    title: "承保信息录入",
    description: "录入车辆、人员与险种信息，提交核保。",
    to: "/apply/form",
    accent: "from-slate-500/15 via-slate-500/5 to-transparent",
    border: "border-slate-200/70",
  },
  {
    title: "投保状态查询",
    description: "查看核保状态与一次性二维码。",
    to: "/history",
    accent: "from-amber-500/15 via-amber-500/5 to-transparent",
    border: "border-amber-200/70",
  },
];

const Entry: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-stone-100">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Salesman Console
          </p>
          <h1
            className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl"
            style={{ fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif' }}
          >
            车险好投保平台合作系统 · 新核心承保系统业务入口
          </h1>
          <p
            className="mt-3 text-base text-slate-600"
            style={{ fontFamily: '"Noto Sans SC", "Source Han Sans SC", sans-serif' }}
          >
            请选择您要进入的流程模块。
          </p>
        </header>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {actions.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.to)}
              className={`group rounded-2xl border ${item.border} bg-white/80 p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
            >
              <div
                className={`mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br ${item.accent}`}
              />
              <h2
                className="text-xl font-semibold text-slate-900"
                style={{ fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif' }}
              >
                {item.title}
              </h2>
              <p
                className="mt-2 text-sm text-slate-600"
                style={{ fontFamily: '"Noto Sans SC", "Source Han Sans SC", sans-serif' }}
              >
                {item.description}
              </p>
              <span className="mt-6 inline-flex items-center text-sm font-medium text-slate-700">
                立即进入 →
              </span>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Entry;
