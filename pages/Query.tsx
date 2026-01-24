import React, { useState } from "react";

const API = "https://xinhexin-api.chinalife-shiexinhexin.workers.dev";

const Query: React.FC = () => {
  const [form, setForm] = useState({
    proposer: "",
    insured: "",
    plate: "",
    vin: ""
  });
  const [list, setList] = useState<any[]>([]);

  const search = async () => {
    const keyword =
      form.proposer || form.insured || form.plate || form.vin;

    const res = await fetch(
      `${API}/api/application/search?keyword=${encodeURIComponent(keyword)}`
    );
    setList(await res.json());
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h2 className="text-lg font-bold">投保信息查询</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <input className="input-base" placeholder="投保人名称"
          onChange={e => setForm(f => ({ ...f, proposer: e.target.value }))} />
        <input className="input-base" placeholder="被保险人名称"
          onChange={e => setForm(f => ({ ...f, insured: e.target.value }))} />
        <input className="input-base" placeholder="车牌号"
          onChange={e => setForm(f => ({ ...f, plate: e.target.value }))} />
        <input className="input-base" placeholder="VIN / 发动机号"
          onChange={e => setForm(f => ({ ...f, vin: e.target.value }))} />
      </div>

      <button
        onClick={search}
        className="px-6 py-2 bg-slate-700 text-white rounded-lg"
      >
        查询
      </button>

      {list.length > 0 && (
        <table className="w-full border text-sm">
          <thead>
            <tr>
              <th>投保单号</th>
              <th>状态</th>
              <th>提交时间</th>
              <th>保单号</th>
            </tr>
          </thead>
          <tbody>
            {list.map(r => (
              <tr key={r.applicationNo}>
                <td>{r.applicationNo}</td>
                <td>{r.status}</td>
                <td>{r.applyAt}</td>
                <td>{r.policyNo || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Query;
