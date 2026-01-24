import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
const API = "https://xinhexin-api.chinalife-shiexinhexin.workers.dev";
const Query = () => {
    const [form, setForm] = useState({
        proposer: "",
        insured: "",
        plate: "",
        vin: ""
    });
    const [list, setList] = useState([]);
    const search = async () => {
        const keyword = form.proposer || form.insured || form.plate || form.vin;
        const res = await fetch(`${API}/api/application/search?keyword=${encodeURIComponent(keyword)}`);
        setList(await res.json());
    };
    return (_jsxs("div", { className: "p-6 max-w-5xl mx-auto space-y-6", children: [_jsx("h2", { className: "text-lg font-bold", children: "\u6295\u4FDD\u4FE1\u606F\u67E5\u8BE2" }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsx("input", { className: "input-base", placeholder: "\u6295\u4FDD\u4EBA\u540D\u79F0", onChange: e => setForm(f => ({ ...f, proposer: e.target.value })) }), _jsx("input", { className: "input-base", placeholder: "\u88AB\u4FDD\u9669\u4EBA\u540D\u79F0", onChange: e => setForm(f => ({ ...f, insured: e.target.value })) }), _jsx("input", { className: "input-base", placeholder: "\u8F66\u724C\u53F7", onChange: e => setForm(f => ({ ...f, plate: e.target.value })) }), _jsx("input", { className: "input-base", placeholder: "VIN / \u53D1\u52A8\u673A\u53F7", onChange: e => setForm(f => ({ ...f, vin: e.target.value })) })] }), _jsx("button", { onClick: search, className: "px-6 py-2 bg-slate-700 text-white rounded-lg", children: "\u67E5\u8BE2" }), list.length > 0 && (_jsxs("table", { className: "w-full border text-sm", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u6295\u4FDD\u5355\u53F7" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u63D0\u4EA4\u65F6\u95F4" }), _jsx("th", { children: "\u4FDD\u5355\u53F7" })] }) }), _jsx("tbody", { children: list.map(r => (_jsxs("tr", { children: [_jsx("td", { children: r.applicationNo }), _jsx("td", { children: r.status }), _jsx("td", { children: r.applyAt }), _jsx("td", { children: r.policyNo || "-" })] }, r.applicationNo))) })] }))] }));
};
export default Query;
