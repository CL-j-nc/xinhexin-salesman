import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/Query.tsx（替换原文件）
import { useState, useEffect } from "react";
const API_BASE = "https://xinhexin-api.chinalife-shiexinhexin.workers.dev";
const statusMap = {
    APPLIED: "待核保",
    UNDERWRITING: "核保中",
    APPROVED: "核保通过（已生成二维码）",
    REJECTED: "核保拒绝",
    PAID: "已支付",
    COMPLETED: "已完成",
};
const Query = () => {
    const [form, setForm] = useState({
        proposer: "",
        insured: "",
        plate: "",
        vin: "",
    });
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    // 页面加载时自动显示最近 20 条记录（历史信息载入）
    useEffect(() => {
        const loadRecent = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/application/search?keyword=`);
                if (res.ok) {
                    const data = await res.json();
                    setList(Array.isArray(data) ? data : []);
                }
            }
            catch (err) {
                console.error("自动加载失败");
            }
            finally {
                setLoading(false);
                setHasSearched(true);
            }
        };
        loadRecent();
    }, []);
    const search = async () => {
        const keyword = [form.proposer, form.insured, form.plate, form.vin]
            .filter(Boolean)
            .join(" ") || ""; // 空关键词时仍查询全部（最近记录）
        setLoading(true);
        setHasSearched(true);
        try {
            const res = await fetch(`${API_BASE}/api/application/search?keyword=${encodeURIComponent(keyword)}`);
            if (!res.ok)
                throw new Error(`请求失败: ${res.status}`);
            const data = await res.json();
            setList(Array.isArray(data) ? data : []);
        }
        catch (err) {
            alert("查询失败: " + err.message);
            setList([]);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "p-6 max-w-5xl mx-auto space-y-8", children: [_jsx("h2", { className: "text-2xl font-bold text-center", children: "\u5386\u53F2\u6295\u4FDD\u8BB0\u5F55\u67E5\u8BE2" }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx("input", { placeholder: "\u6295\u4FDD\u4EBA\u59D3\u540D", value: form.proposer, onChange: (e) => setForm({ ...form, proposer: e.target.value }), className: "border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500" }), _jsx("input", { placeholder: "\u88AB\u4FDD\u9669\u4EBA\u59D3\u540D", value: form.insured, onChange: (e) => setForm({ ...form, insured: e.target.value }), className: "border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500" }), _jsx("input", { placeholder: "\u8F66\u724C\u53F7", value: form.plate, onChange: (e) => setForm({ ...form, plate: e.target.value.toUpperCase() }), className: "border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500" }), _jsx("input", { placeholder: "\u8F66\u67B6\u53F7\uFF08VIN\uFF09", value: form.vin, onChange: (e) => setForm({ ...form, vin: e.target.value.toUpperCase() }), className: "border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500" })] }), _jsx("div", { className: "text-center", children: _jsx("button", { onClick: search, disabled: loading, className: "px-8 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50", children: loading ? "查询中..." : "查询" }) })] }), loading && _jsx("div", { className: "text-center text-slate-500", children: "\u52A0\u8F7D\u4E2D..." }), list.length > 0 && (_jsx("div", { className: "bg-white rounded-xl shadow-sm overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-slate-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4 text-left", children: "\u6295\u4FDD\u5355\u53F7" }), _jsx("th", { className: "px-6 py-4 text-left", children: "\u6838\u4FDD\u72B6\u6001" }), _jsx("th", { className: "px-6 py-4 text-left", children: "\u63D0\u4EA4\u65F6\u95F4" }), _jsx("th", { className: "px-6 py-4 text-left", children: "\u4FDD\u5355\u53F7" })] }) }), _jsx("tbody", { children: list.map((r) => (_jsxs("tr", { className: "border-t hover:bg-slate-50", children: [_jsx("td", { className: "px-6 py-4 font-medium", children: r.applicationNo }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `inline-block px-3 py-1 rounded-full text-xs font-medium ${r.status === "APPROVED" || r.status === "COMPLETED"
                                                ? "bg-green-100 text-green-800"
                                                : r.status === "REJECTED"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-yellow-100 text-yellow-800"}`, children: statusMap[r.status] || r.status }) }), _jsx("td", { className: "px-6 py-4", children: new Date(r.applyAt).toLocaleString() }), _jsx("td", { className: "px-6 py-4", children: r.policyNo || "-" })] }, r.applicationNo))) })] }) })), !loading && hasSearched && list.length === 0 && (_jsx("div", { className: "text-center text-slate-500 py-12", children: "\u6682\u65E0\u7B26\u5408\u6761\u4EF6\u7684\u8BB0\u5F55\uFF08\u53EF\u5C1D\u8BD5\u6E05\u7A7A\u6761\u4EF6\u91CD\u65B0\u67E5\u8BE2\uFF09" }))] }));
};
export default Query;
