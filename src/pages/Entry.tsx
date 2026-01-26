import React from "react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    title: "投保意愿申请",
    description: "提交投保意愿，进入核保准备流程。",
    to: "/apply",
    accent: "bg-emerald-500/30",
    border: "border-emerald-200/70",
  },
  {
    title: "承保信息录入",
    description: "录入车辆、人员与险种信息，提交核保。",
    to: "/apply/form",
    accent: "bg-slate-400/30",
    border: "border-slate-200/70",
  },
  {
    title: "投保状态查询",
    description: "查看核保状态与一次性二维码。",
    to: "/history",
    accent: "bg-amber-400/30",
    border: "border-amber-200/70",
  },
];

const Entry: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <header className="border-b border-emerald-200 pb-4">
          <h1
            className="text-2xl font-semibold text-emerald-700 md:text-3xl"
            style={{ fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif' }}
          >
            车险好投保平台合作系统 · 新核心承保系统业务入口
          </h1>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {actions.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.to)}
              className={`group rounded-md border ${item.border} bg-white p-4 text-left shadow-sm transition hover:border-emerald-300`}
            >
              <div className={`mb-3 h-1.5 w-12 rounded-full ${item.accent}`} />
              <h2
                className="text-lg font-semibold text-slate-900"
                style={{ fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif' }}
              >
                {item.title}
              </h2>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Entry;
