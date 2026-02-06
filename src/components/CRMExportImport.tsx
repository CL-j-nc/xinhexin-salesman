import React, { useState, useRef } from "react";
import { cn } from "../utils/cn";
import {
    downloadVehiclesCSV,
    downloadCustomersCSV,
    handleFileImport,
    importTestVehicles,
} from "../utils/crmExportImport";

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
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!visible) return null;

    const handleExportVehicles = () => {
        downloadVehiclesCSV();
        setImportResult({ success: true, message: "车辆数据已导出" });
    };

    const handleExportCustomers = () => {
        downloadCustomersCSV();
        setImportResult({ success: true, message: "客户数据已导出" });
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImportTestVehicles = async () => {
        setImporting(true);
        setImportResult(null);

        const result = await importTestVehicles();
        setImporting(false);

        if (result.success) {
            setImportResult({
                success: true,
                message: `成功导入 ${result.imported} 条测试数据`,
            });
            onImportComplete?.();
        } else {
            setImportResult({
                success: false,
                message: `导入失败：${result.errors.join("; ")}`,
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);

        handleFileImport(file, "vehicles", (result) => {
            setImporting(false);
            if (result.success) {
                setImportResult({
                    success: true,
                    message: `成功导入 ${result.imported} 条车辆数据`,
                });
                onImportComplete?.();
            } else {
                setImportResult({
                    success: false,
                    message: `导入失败：${result.errors.join("; ")}`,
                });
            }
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
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button
                            onClick={handleImportClick}
                            disabled={importing}
                            className={cn(
                                "w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors",
                                importing && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {importing ? "导入中..." : "点击选择 CSV 文件导入车辆数据"}
                        </button>
                        <p className="text-xs text-gray-400">
                            支持的列：车牌号、车架号(VIN)、发动机号、品牌型号、车辆类型、车主姓名、车主电话、车主身份证等
                        </p>
                    </div>

                    {/* 分割线 */}
                    <div className="border-t border-gray-200" />

                    {/* 测试数据区域 */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-700">🧪 测试数据</h3>
                        <button
                            onClick={handleImportTestVehicles}
                            disabled={importing}
                            className={cn(
                                "w-full py-2 px-4 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium",
                                importing && "opacity-50 cursor-not-allowed"
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
