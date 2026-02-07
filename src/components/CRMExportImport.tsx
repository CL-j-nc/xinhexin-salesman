import React, { useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import {
    downloadVehiclesCSV,
    downloadCustomersCSV,
    downloadVehiclesImportTemplateCSV,
    handleFileImport,
    importTestVehicles,
    type ImportResult,
} from "../utils/crmExportImport";
import { crmDataSource } from "../utils/crmDataSource";

interface CRMExportImportProps {
    visible: boolean;
    onClose: () => void;
    onImportComplete?: () => void;
}

const CRMExportImport: React.FC<CRMExportImportProps> = ({
    visible,
    onClose,
    onImportComplete,
}) => {
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{
        success: boolean;
        message: string;
        diagnostics?: string[];
    } | null>(null);
    const [apiStatus, setApiStatus] = useState<{
        loading: boolean;
        ok: boolean;
        baseUrl?: string;
        reason?: string;
    }>({
        loading: false,
        ok: false,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!visible) return;
        let cancelled = false;

        const checkApiHealth = async () => {
            setApiStatus({
                loading: true,
                ok: false,
            });
            try {
                const result = await crmDataSource.checkHealth();
                if (cancelled) return;
                setApiStatus({
                    loading: false,
                    ok: result.ok,
                    baseUrl: result.baseUrl,
                    reason: result.reason,
                });
            } catch (error) {
                if (cancelled) return;
                setApiStatus({
                    loading: false,
                    ok: false,
                    reason: error instanceof Error ? error.message : "健康检查失败",
                });
            }
        };

        checkApiHealth();
        return () => {
            cancelled = true;
        };
    }, [visible]);

    if (!visible) return null;

    const importUnavailable = importing || apiStatus.loading || !apiStatus.ok;
    const applyImportResult = (result: ImportResult, successPrefix: string) => {
        if (result.success) {
            setImportResult({
                success: true,
                message: `${successPrefix} ${result.imported} 条`,
            });
            onImportComplete?.();
            return;
        }

        setImportResult({
            success: false,
            message: `导入失败：${result.errors.join("; ")}`,
            diagnostics: result.diagnostics,
        });
    };

    const handleExportVehicles = () => {
        downloadVehiclesCSV();
        setImportResult({ success: true, message: "车辆数据已导出" });
    };

    const handleExportCustomers = () => {
        downloadCustomersCSV();
        setImportResult({ success: true, message: "客户数据已导出" });
    };

    const handleImportClick = () => {
        if (importUnavailable) return;
        fileInputRef.current?.click();
    };

    const handleDownloadTemplate = () => {
        downloadVehiclesImportTemplateCSV();
        setImportResult({
            success: true,
            message: "已下载 CRM 导入样表，请按样表列名填写后再导入",
        });
    };

    const handleImportTestVehicles = async () => {
        setImporting(true);
        setImportResult(null);

        const result = await importTestVehicles();
        setImporting(false);

        applyImportResult(result, "成功导入测试数据");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);

        handleFileImport(file, "vehicles", (result) => {
            setImporting(false);
            applyImportResult(result, "成功导入车辆数据");
        });

        // 清空文件选择
        e.target.value = "";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl shadow-xl w-[90%] max-w-md overflow-hidden">
                {/* 标题 */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4">
                    <h2 className="text-lg font-bold">CRM 数据导入导出</h2>
                    <p className="text-sm text-white/80">支持 CSV 格式</p>
                </div>

                {/* 内容 */}
                <div className="p-4 space-y-4">
                    {/* API 状态 */}
                    <div
                        className={cn(
                            "rounded-lg border px-3 py-2 text-sm",
                            apiStatus.loading && "border-slate-200 bg-slate-50 text-slate-600",
                            !apiStatus.loading && apiStatus.ok && "border-emerald-200 bg-emerald-50 text-emerald-700",
                            !apiStatus.loading && !apiStatus.ok && "border-red-200 bg-red-50 text-red-700"
                        )}
                    >
                        {apiStatus.loading && "正在检查后端 API 状态..."}
                        {!apiStatus.loading && apiStatus.ok && `API 在线：${apiStatus.baseUrl || "已连接"}`}
                        {!apiStatus.loading && !apiStatus.ok && `API 异常：${apiStatus.reason || "后端服务不可达"}`}
                    </div>
                    {!apiStatus.loading && !apiStatus.ok && (
                        <p className="text-xs text-red-600">
                            当前已禁用导入功能。请检查 `VITE_API_BASE_URL` 配置与后端 Worker 运行状态。
                        </p>
                    )}

                    {/* 导出区域 */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-700">📤 导出数据</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportVehicles}
                                className="flex-1 py-2 px-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                            >
                                导出车辆档案
                            </button>
                            <button
                                onClick={handleExportCustomers}
                                className="flex-1 py-2 px-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                            >
                                导出客户档案
                            </button>
                        </div>
                    </div>

                    {/* 分割线 */}
                    <div className="border-t border-gray-200" />

                    {/* 导入区域 */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-700">📥 导入数据</h3>
                        <button
                            onClick={handleDownloadTemplate}
                            className="w-full py-2 px-4 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                        >
                            下载 CRM 导入样表（CSV）
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button
                            onClick={handleImportClick}
                            disabled={importUnavailable}
                            className={cn(
                                "w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors",
                                importUnavailable && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {importing ? "导入中..." : "点击选择 CSV 文件导入车辆数据"}
                        </button>
                        <p className="text-xs text-gray-400">
                            请先下载样表并按样表列名准备文件；支持列：车牌号、车架号(VIN)、发动机号、品牌型号、车辆类型、车主姓名、车主电话、车主身份证等
                        </p>
                    </div>

                    {/* 分割线 */}
                    <div className="border-t border-gray-200" />

                    {/* 测试数据区域 */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-700">🧪 测试数据</h3>
                        <button
                            onClick={handleImportTestVehicles}
                            disabled={importUnavailable}
                            className={cn(
                                "w-full py-2 px-4 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium",
                                importUnavailable && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            一键导入测试数据 (Mock Data)
                        </button>
                        <p className="text-xs text-gray-400">
                            将导入预设的测试车辆和车主信息
                        </p>
                    </div>

                    {/* 结果提示 */}
                    {importResult && (
                        <div
                            className={cn(
                                "p-3 rounded-lg text-sm",
                                importResult.success
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700"
                            )}
                        >
                            {importResult.message}
                            {!!importResult.diagnostics?.length && (
                                <div className="mt-2 border-t border-current/20 pt-2 text-xs leading-relaxed opacity-90">
                                    {importResult.diagnostics.map((item, index) => (
                                        <div key={`${item}-${index}`}>{item}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 底部按钮 */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CRMExportImport;
