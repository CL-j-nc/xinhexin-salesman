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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <header className="text-center">
          <h1
            className="text-2xl font-semibold text-slate-900 md:text-3xl"
            style={{ fontFamily: '"ZCOOL XiaoWei", "Noto Serif SC", serif' }}
          >
            投保申请状态查询
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            仅展示核保状态与一次性二维码。
          </p>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <input
              placeholder="投保人姓名"
              value={form.proposer}
              onChange={(e) => setForm({ ...form, proposer: e.target.value })}
              className="rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <input
              placeholder="被保险人姓名"
              value={form.insured}
              onChange={(e) => setForm({ ...form, insured: e.target.value })}
              className="rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <input
              placeholder="车牌号"
              value={form.plate}
              onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
              className="rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <input
              placeholder="车架号（VIN）"
              value={form.vin}
              onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
              className="rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div className="mt-5 text-center">
            <button
              onClick={search}
              disabled={loading}
              className="rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "查询中..." : "查询"}
            </button>
          </div>
        </div>

        {loading && <div className="text-center text-slate-500">加载中...</div>}

        <section className="grid gap-6 lg:grid-cols-2">
          {list.map((item, index) => {
            const status = item.status || "UNKNOWN";
            const label = statusMap[status] || status;
            const key = `${index}-${status}`;
            const qrSrc = qrImages[key];

            return (
              <div
                key={key}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">核保状态</p>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {label}
                  </span>
                </div>

                <div className="mt-5 flex flex-col items-center gap-3">
                  {status === "COMPLETED" && (
                    <p className="text-sm text-slate-500">
                      二维码已失效，状态已完成。
                    </p>
                  )}
                  {status !== "COMPLETED" && qrSrc && (
                    <>
                      <img
                        src={qrSrc}
                        alt="投保二维码"
                        className="h-44 w-44 rounded-xl border border-slate-100 bg-white p-2"
                      />
                      <p className="text-xs text-slate-500">
                        二维码仅可使用一次，支付完成后自动失效。
                      </p>
                    </>
                  )}
                  {status !== "COMPLETED" && !qrSrc && (
                    <p className="text-sm text-slate-500">二维码暂未生成。</p>
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
