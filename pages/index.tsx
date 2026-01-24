import React from "react";
import { useNavigate } from "react-router-dom";

const Menu: React.FC = () => {
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 space-y-6 w-full max-w-md">
        <h1 className="text-xl font-bold text-center">Salesman 工作台</h1>

        <button
          className="w-full py-4 rounded-xl bg-emerald-600 text-white font-medium"
          onClick={() => nav("/salesman/apply")}
        >
          1️⃣ 投保信息录入
        </button>

        <button
          className="w-full py-4 rounded-xl bg-slate-700 text-white font-medium"
          onClick={() => nav("/salesman/query")}
        >
          2️⃣ 投保信息查询
        </button>
      </div>
    </div>
  );
};

export default Menu;
