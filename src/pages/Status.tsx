import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 状态显示文案映射
const STATUS_TEXT_MAP: Record<string, string> = {
  APPLIED: "投保成功",
  SUBMITTED: "已提交",
  UI: "核保中",
  UA: "核保通过",
  UR: "退回修改",
  PAID: "已支付",
  ISSUED: "已承保",
  REJECTED: "已拒保",
};

// 状态图标映射
const STATUS_ICON_MAP: Record<string, string> = {
  APPLIED: "✅",
  UI: "⏳",
  UA: "✅",
  UR: "⚠️",
  PAID: "💳",
  ISSUED: "📋",
};

// 状态颜色映射
const STATUS_COLOR_MAP: Record<string, string> = {
  APPLIED: "text-emerald-600",
  UI: "text-blue-600",
  UA: "text-emerald-600",
  UR: "text-orange-600",
  PAID: "text-emerald-600",
  ISSUED: "text-emerald-600",
};

interface SearchResult {
  applicationNo: string;
  status: string;
  createdAt: string;
  vehicle?: any;
  owner?: any;
}

export default function Status() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"status" | "search">("status");

  // 状态视图 state
  const [status, setStatus] = useState<string | null>(null);
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 搜索视图 state
  const [searchFields, setSearchFields] = useState<string[]>(['', '', '', '', '']);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const applicationId = sessionStorage.getItem("applicationId");

  useEffect(() => {
    // 如果没有 applicationId，自动切换到搜索模式
    if (!applicationId) {
      setMode("search");
      setLoading(false);
      return;
    }

    let timer: number;

    // 核心轮询逻辑：只读取 status
    const queryStatus = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(`${API_BASE_URL}/api/proposal/status?id=${applicationId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("查询失败");

        const data = await res.json();

        setStatus(data.status);
        setReason(data.reason || "");
        setLoading(false);

        // 终态停止轮询
        if (data.status === "PAID" || data.status === "ISSUED" || data.status === "REJECTED") {
          clearInterval(timer);
        }
      } catch (e: any) {
        setError(e.message || "接口异常");
        setLoading(false);
        clearInterval(timer);
      }
    };

    queryStatus();
    timer = window.setInterval(queryStatus, 5000);

    return () => clearInterval(timer);
  }, [applicationId]);

  // 多条件搜索处理
  const handleFieldChange = (index: number, value: string) => {
    const newFields = [...searchFields];
    newFields[index] = value;
    setSearchFields(newFields);
  };

  const handleSearch = async () => {
    const filledFields = searchFields.filter(f => f.trim());
    if (filledFields.length < 2) {
      setSearchError('请至少填写两个查询条件');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${API_BASE_URL}/api/application/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insuredName: searchFields[0],
          idCard: searchFields[1],
          mobile: searchFields[2],
          plate: searchFields[3],
          engineNo: searchFields[4],
        }),
      });

      if (!response.ok) {
        throw new Error(`搜索失败: ${response.status}`);
      }

      const results = await response.json();
      setSearchResults(Array.isArray(results) ? results : []);

      if (results.length === 0) {
        setSearchError('未找到匹配的投保记录');
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : '搜索出错');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const statusDisplay = (statusCode: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      APPLIED: { text: '投保成功', color: 'bg-emerald-100 text-emerald-700' },
      UI: { text: '核保中', color: 'bg-blue-100 text-blue-700' },
      UA: { text: '核保通过', color: 'bg-emerald-100 text-emerald-700' },
      UR: { text: '退回修改', color: 'bg-orange-100 text-orange-700' },
      PAID: { text: '已支付', color: 'bg-emerald-100 text-emerald-700' },
      ISSUED: { text: '已承保', color: 'bg-emerald-100 text-emerald-700' },
    };
    const info = statusMap[statusCode] || { text: statusCode, color: 'bg-gray-100 text-gray-700' };
    return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${info.color}`}>{info.text}</span>;
  };

  // 渲染搜索视图
  const renderSearchView = () => (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">核保进度查询</h1>
        <p className="text-slate-600 mb-8">输入任意 2 个以上条件，查询您的投保核保进度</p>

        {/* Search Form */}
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">被保险人名称</label>
              <input
                type="text"
                placeholder="输入被保险人名称"
                value={searchFields[0]}
                onChange={(e) => handleFieldChange(0, e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">身份证号</label>
              <input
                type="text"
                placeholder="输入身份证号"
                value={searchFields[1]}
                onChange={(e) => handleFieldChange(1, e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">手机号</label>
              <input
                type="text"
                placeholder="输入手机号"
                value={searchFields[2]}
                onChange={(e) => handleFieldChange(2, e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">车牌号</label>
              <input
                type="text"
                placeholder="输入车牌号"
                value={searchFields[3]}
                onChange={(e) => handleFieldChange(3, e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">发动机号</label>
              <input
                type="text"
                placeholder="输入发动机号"
                value={searchFields[4]}
                onChange={(e) => handleFieldChange(4, e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={searchLoading}
            className="w-full py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-slate-400"
          >
            {searchLoading ? '查询中...' : '查询进度'}
          </button>
        </div>

        {/* Error Message */}
        {searchError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {searchError}
          </div>
        )}

        {/* Results */}
        {hasSearched && searchResults.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">投保单号</th>
                  <th className="px-4 py-3 text-left">被保险人</th>
                  <th className="px-4 py-3 text-left">车牌号</th>
                  <th className="px-4 py-3 text-left">核保进度</th>
                  <th className="px-4 py-3 text-left">申请时间</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((result) => (
                  <tr key={result.applicationNo} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-sm font-bold">{result.applicationNo}</td>
                    <td className="px-4 py-3">{result.owner?.name || '-'}</td>
                    <td className="px-4 py-3 font-mono text-blue-600 font-bold">{result.vehicle?.plate || '-'}</td>
                    <td className="px-4 py-3">{statusDisplay(result.status)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(result.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasSearched && searchResults.length === 0 && !searchError && (
          <div className="text-center py-12">
            <p className="text-slate-500">暂无查询结果</p>
          </div>
        )}

        {!hasSearched && (
          <div className="text-center py-12 text-slate-500">
            <p>输入查询条件后点击"查询进度"按钮</p>
          </div>
        )}

        {/* 返回首页按钮 */}
        <div className="mt-8">
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );

  // 渲染状态视图（保持原有UI不变）
  const renderStatusView = () => {
    // 错误处理
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <div className="text-lg font-bold text-red-600">{error}</div>
            <button
              onClick={() => setMode("search")}
              className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              多条件查询
            </button>
            <button
              onClick={() => navigate("/")}
              className="mt-4 ml-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      );
    }

    // 加载中
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="animate-spin text-4xl">⏳</div>
            <div className="text-lg font-bold text-gray-700">查询中...</div>
          </div>
        </div>
      );
    }

    // 状态为空（未找到）
    if (!status) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="text-4xl text-gray-400">📋</div>
            <div className="text-lg font-bold text-gray-700">未找到投保记录</div>
            <button
              onClick={() => setMode("search")}
              className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              多条件查询
            </button>
            <button
              onClick={() => navigate("/")}
              className="mt-4 ml-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      );
    }

    // 显示状态（保持原有UI）
    return (
      <div className="max-w-2xl mx-auto pt-12 px-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center space-y-6">
            {/* 状态图标 */}
            <div className={`text-6xl ${STATUS_ICON_MAP[status] ? "" : "animate-spin"}`}>
              {STATUS_ICON_MAP[status] || "⏳"}
            </div>

            {/* 状态文字 */}
            <div className={`text-2xl font-bold ${STATUS_COLOR_MAP[status] || "text-gray-700"}`}>
              {STATUS_TEXT_MAP[status] || status}
            </div>

            {/* 退回原因（仅在UR状态显示） */}
            {status === "UR" && reason && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <div className="text-sm font-bold text-red-800 mb-2">退回原因：</div>
                <div className="text-sm text-red-700">{reason}</div>
              </div>
            )}

            {/* 状态说明 */}
            <div className="text-sm text-gray-600 mt-4 leading-relaxed">
              {status === "APPLIED" ? (
                <p>✨ 投保申请已成功提交！<br />系统已将您的申请转入核保审核，请耐心等待</p>
              ) : status === "UI" ? (
                <p>⏳ 核保中<br />系统正在进行风险评估，请耐心等待</p>
              ) : status === "UA" ? (
                <p>🎉 恭喜您！您的投保申请已通过核保<br />现在可以前往支付完成投保</p>
              ) : status === "UR" ? (
                <p>⚠️ 您的投保申请需要修改后重新提交</p>
              ) : status === "PAID" ? (
                <p>✅ 支付成功，系统正在生成保单</p>
              ) : status === "ISSUED" ? (
                <p>🎊 保单已生成，恭喜您承保成功！</p>
              ) : null}
            </div>

            {/* 按钮区域 */}
            <div className="mt-8 space-y-3">
              {/* 核保通过后显示支付按钮 */}
              {status === "UA" && (
                <button
                  onClick={() => alert("跳转支付页面（待对接）")}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  前往支付
                </button>
              )}

              {/* 退回修改后显示重新提交按钮 */}
              {status === "UR" && (
                <button
                  onClick={() => navigate("/apply")}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  重新提交
                </button>
              )}

              {/* 多条件查询按钮 */}
              <button
                onClick={() => setMode("search")}
                className="w-full py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                多条件查询
              </button>

              {/* 返回首页按钮 */}
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="text-center text-xs text-gray-400 mt-6">
          <p>申请单号：{applicationId}</p>
          <p className="mt-2">系统每5秒自动刷新状态</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 切换模式的Tab（当有applicationId时显示） */}
      {applicationId && (
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setMode("status")}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${mode === "status"
                  ? "bg-white text-emerald-600 shadow"
                  : "text-slate-600 hover:text-slate-800"
                }`}
            >
              当前进度
            </button>
            <button
              onClick={() => setMode("search")}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${mode === "search"
                  ? "bg-white text-emerald-600 shadow"
                  : "text-slate-600 hover:text-slate-800"
                }`}
            >
              多条件查询
            </button>
          </div>
        </div>
      )}

      {mode === "search" ? renderSearchView() : renderStatusView()}
    </div>
  );
}
