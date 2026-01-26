import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
const Menu = () => {
    const nav = useNavigate();
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-slate-50", children: _jsxs("div", { className: "bg-white border border-slate-200 rounded-2xl p-10 space-y-6 w-full max-w-md", children: [_jsx("h1", { className: "text-xl font-bold text-center", children: "Salesman \u5DE5\u4F5C\u53F0" }), _jsx("button", { className: "w-full py-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700", onClick: () => nav("/salesman/apply"), children: "1\uFE0F\u20E3 \u6295\u4FDD\u4FE1\u606F\u5F55\u5165" }), _jsx("button", { className: "w-full py-4 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-800", onClick: () => nav("/salesman/query"), children: "2\uFE0F\u20E3 \u5386\u53F2\u6295\u4FDD\u8BB0\u5F55\u67E5\u8BE2" })] }) }));
};
export default Menu;
