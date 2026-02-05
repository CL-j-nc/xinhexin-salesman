import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

interface SearchResult {
    applicationNo: string;
    status: string;
    createdAt: string;
    vehicle?: any;
    owner?: any;
}

const UnderwritingQuery: React.FC = () => {
    const navigate = useNavigate();
    const [searchFields, setSearchFields] = useState<string[]>(['', '']);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleFieldChange = (index: number, value: string) => {
        const newFields = [...searchFields];
        newFields[index] = value;
        setSearchFields(newFields);
    };

    const handleSearch = async () => {
        // 验证至少填了两个字段
        const filledFields = searchFields.filter(f => f.trim());
        if (filledFields.length < 2) {
            setError('请至少填写两个查询条件');
            return;
        }

        setLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const response = await fetch('/api/application/search', {
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
                setError('未找到匹配的投保记录');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '搜索出错');
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const statusDisplay = (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
            APPLIED: { text: '投保成功', color: 'bg-emerald-100 text-emerald-700' },
            UI: { text: '核保中', color: 'bg-blue-100 text-blue-700' },
            UA: { text: '核保通过', color: 'bg-emerald-100 text-emerald-700' },
            UR: { text: '退回修改', color: 'bg-orange-100 text-orange-700' },
            PAID: { text: '已支付', color: 'bg-emerald-100 text-emerald-700' },
            ISSUED: { text: '已承保', color: 'bg-emerald-100 text-emerald-700' },
        };
        const info = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-700' };
        return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${info.color}`}>{info.text}</span>;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <Header />

            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">投保核保查询</h1>
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
                            disabled={loading}
                            className="w-full py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-slate-400"
                        >
                            {loading ? '查询中...' : '查询进度'}
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
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

                    {hasSearched && searchResults.length === 0 && !error && (
                        <div className="text-center py-12">
                            <p className="text-slate-500">暂无查询结果</p>
                        </div>
                    )}

                    {!hasSearched && (
                        <div className="text-center py-12 text-slate-500">
                            <p>输入查询条件后点击"查询进度"按钮</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnderwritingQuery;
