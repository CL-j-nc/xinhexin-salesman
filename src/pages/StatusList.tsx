import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

const API_BASE = "https://xinhexin-api.chinalife-shiexinhexin.workers.dev";

const statusMap: Record<string, string> = {
  APPLIED: "已提交",
  UNDERWRITING: "核保中",
  APPROVED: "核保通过",
  REJECTED: "核保拒绝",
  PAID: "已支付",
  COMPLETED: "已完成",
};

type StatusRecord = {
  status?: string;
  qr?: string;
  updatedAt?: string;
  createdAt?: string;
};

const StatusList: React.FC = () => {
  const [form, setForm] = useState({
    proposer: "",
    insured: "",
    plate: "",
    vin: "",
  });
  const [list, setList] = useState<StatusRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});

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

  useEffect(() => {
    let active = true;

    const buildQr = async () => {
      const next: Record<string, string> = {};

      for (let i = 0; i < list.length; i += 1) {
        const item = list[i];
        const key = `${i}-${item.status || "unknown"}`;
        const payload = item.qr;

        if (!payload || item.status === "COMPLETED") continue;

        if (payload.startsWith("data:image") || payload.startsWith("http")) {
          next[key] = payload;
          continue;
        }

        if (/^[A-Za-z0-9+/=]+$/.test(payload) && payload.length > 80) {
          next[key] = `data:image/png;base64,${payload}`;
          continue;
        }

        try {
          const dataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 220 });
          next[key] = dataUrl;
        } catch (error) {
          console.error("二维码生成失败");
        }
      }

      if (active) {
        setQrImages(next);
      }
    };

    buildQr();
    return () => {
      active = false;
    };
  }, [list]);

  const search = async () => {
    const keyword =
      [form.proposer, form.insured, form.plate, form.vin].filter(Boolean).join(" ") || "";

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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-5 px-5 py-8">
        <header className="border-b border-slate-200 pb-4">
          <h1
            className="text-lg font-semibold text-slate-900"
            style={{ fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif' }}
          >
            投保申请状态查询
          </h1>
        </header>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <input
              placeholder="投保人姓名"
              value={form.proposer}
              onChange={(e) => setForm({ ...form, proposer: e.target.value })}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <input
              placeholder="被保险人姓名"
              value={form.insured}
              onChange={(e) => setForm({ ...form, insured: e.target.value })}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <input
              placeholder="车牌号"
              value={form.plate}
              onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <input
              placeholder="车架号（VIN）"
              value={form.vin}
              onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={search}
              disabled={loading}
              className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "查询中..." : "查询"}
            </button>
          </div>
        </div>

        {loading && <div className="text-center text-slate-500">加载中...</div>}

        <section className="grid gap-4 lg:grid-cols-2">
          {list.map((item, index) => {
            const status = item.status || "UNKNOWN";
            const label = statusMap[status] || status;
            const key = `${index}-${status}`;
            const qrSrc = qrImages[key];

            return (
              <div
                key={key}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">核保状态</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {label}
                  </span>
                </div>

                <div className="mt-3 flex flex-col items-center gap-2">
                  {status === "COMPLETED" && (
                    <p className="text-xs text-slate-500">
                      二维码已失效，状态已完成。
                    </p>
                  )}
                  {status !== "COMPLETED" && qrSrc && (
                    <>
                      <img
                        src={qrSrc}
                        alt="投保二维码"
                        className="h-32 w-32 rounded-md border border-slate-100 bg-white p-1.5"
                      />
                    </>
                  )}
                  {status !== "COMPLETED" && !qrSrc && (
                    <p className="text-xs text-slate-500">二维码暂未生成。</p>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {!loading && hasSearched && list.length === 0 && (
          <div className="text-center text-slate-500">暂无符合条件的记录。</div>
        )}
      </div>
    </div>
  );
};

export default StatusList;
