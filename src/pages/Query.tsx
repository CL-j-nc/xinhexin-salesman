// src/pages/Query.tsx（替换原文件）

import React, { useState, useEffect } from "react";

const API_BASE = "https://xinhexin-api.chinalife-shiexinhexin.workers.dev";

const statusMap: Record<string, string> = {
  APPLIED: "待核保",
  UNDERWRITING: "核保中",
  APPROVED: "核保通过（已生成二维码）",
  REJECTED: "核保拒绝",
  PAID: "已支付",
  COMPLETED: "已完成",
};

const Query: React.FC = () => {
  const [form, setForm] = useState({
    proposer: "",
    insured: "",
    plate: "",
    vin: "",
  });
  const [list, setList] = useState<any[]>([]);
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
      } catch (err) {
        console.error("自动加载失败");
      } finally {
        setLoading(false);
        setHasSearched(true);
      }
    };
    loadRecent();
  }, []);

  const search = async () => {
    const keyword = [form.proposer, form.insured, form.plate, form.vin]
      .filter(Boolean)
      .join(" ") || "";  // 空关键词时仍查询全部（最近记录）

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/application/search?keyword=${encodeURIComponent(keyword)}`
      );
      if (!res.ok) throw new Error(`请求失败: ${res.status}`);
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      alert("查询失败: " + err.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold text-center">历史投保记录查询</h2>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            placeholder="投保人姓名"
            value={form.proposer}
            onChange={(e) => setForm({ ...form, proposer: e.target.value })}
            className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            placeholder="被保险人姓名"
            value={form.insured}
            onChange={(e) => setForm({ ...form, insured: e.target.value })}
            className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            placeholder="车牌号"
            value={form.plate}
            onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
            className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            placeholder="车架号（VIN）"
            value={form.vin}
            onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
            className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="text-center">
          <button
            onClick={search}
            disabled={loading}
            className="px-8 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "查询中..." : "查询"}
          </button>
        </div>
      </div>

      {loading && <div className="text-center text-slate-500">加载中...</div>}

      {list.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left">投保单号</th>
                <th className="px-6 py-4 text-left">核保状态</th>
                <th className="px-6 py-4 text-left">提交时间</th>
                <th className="px-6 py-4 text-left">保单号</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.applicationNo} className="border-t hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">{r.applicationNo}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${r.status === "APPROVED" || r.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : r.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {statusMap[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(r.applyAt).toLocaleString()}</td>
                  <td className="px-6 py-4">{r.policyNo || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && hasSearched && list.length === 0 && (
        <div className="text-center text-slate-500 py-12">
          暂无符合条件的记录（可尝试清空条件重新查询）
        </div>
      )}
    </div>
  );
};

export default Query;