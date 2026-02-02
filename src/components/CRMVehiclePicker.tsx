import React, { useState, useEffect } from "react";
import { cn } from "../utils/cn";
import type { CRMVehicle } from "../utils/crmStorage";
import { crmDataSource } from "../utils/crmDataSource";

interface CRMVehiclePickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (vehicle: CRMVehicle) => void;
}

type TabType = "all" | "frequent" | "favorite" | "test";

const CRMVehiclePicker: React.FC<CRMVehiclePickerProps> = ({
    visible,
    onClose,
    onSelect,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<TabType>("all");
    const [vehicles, setVehicles] = useState<CRMVehicle[]>([]);

    useEffect(() => {
        if (visible) {
            loadVehicles();
        }
    }, [visible, activeTab, searchQuery]);

    const loadVehicles = async () => {
        try {
            let result: CRMVehicle[] = [];

            if (searchQuery) {
                result = await crmDataSource.searchVehicles(searchQuery);
            } else {
                const allVehicles = await crmDataSource.searchVehicles("");

                switch (activeTab) {
                    case "all":
                        result = allVehicles;
                        break;
                    case "frequent":
                        result = allVehicles
                            .sort((a, b) => b.usageCount - a.usageCount)
                            .slice(0, 10);
                        break;
                    case "favorite":
                        result = allVehicles.filter((v) => v.isFavorite);
                        break;
                    case "test":
                        result = allVehicles.filter((v) => v.tags?.includes("测试数据"));
                        break;
                }
            }

            setVehicles(result);
        } catch (error) {
            console.error("Failed to load vehicles:", error);
            setVehicles([]);
        }
    };

    const handleSelect = async (vehicle: CRMVehicle) => {
        await crmDataSource.updateVehicleUsage(vehicle.id);
        onSelect(vehicle);
        onClose();
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
            <div className="bg-white w-full max-h-[80vh] rounded-t-3xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">从 CRM 导入车辆</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索车牌号、车架号、品牌..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Tabs */}
                {!searchQuery && (
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 overflow-x-auto">
                        {[
                            { id: "all" as const, label: "全部" },
                            { id: "frequent" as const, label: "常用" },
                            { id: "favorite" as const, label: "收藏" },
                            { id: "test" as const, label: "测试数据" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-emerald-500 text-white"
                                        : "bg-gray-100 text-gray-600"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Vehicle List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {vehicles.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-sm">
                                {searchQuery ? "未找到匹配的车辆" : "暂无车辆数据"}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {vehicles.map((vehicle) => (
                                <button
                                    key={vehicle.id}
                                    onClick={() => handleSelect(vehicle)}
                                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-emerald-500 hover:shadow-md transition-all active:scale-[0.98]"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-gray-800 text-lg">
                                                    {vehicle.plate}
                                                </span>
                                                {vehicle.isFavorite && (
                                                    <span className="text-yellow-500">⭐</span>
                                                )}
                                                <span
                                                    className={cn(
                                                        "px-2 py-0.5 text-xs rounded-full",
                                                        vehicle.energyType === "NEV"
                                                            ? "bg-emerald-100 text-emerald-600"
                                                            : "bg-blue-100 text-blue-600"
                                                    )}
                                                >
                                                    {vehicle.energyType === "NEV" ? "新能源" : "燃油车"}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {vehicle.nickname}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {vehicle.brand}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                车架号: {vehicle.vin}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {vehicle.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs rounded-full"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                                        <div>
                                            <span className="text-gray-400">使用性质:</span>{" "}
                                            {vehicle.useNature}
                                        </div>
                                        <div>
                                            <span className="text-gray-400">载客:</span>{" "}
                                            {vehicle.seats}人
                                        </div>
                                        <div>
                                            <span className="text-gray-400">注册:</span>{" "}
                                            {vehicle.registerDate}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2">
                                        使用 {vehicle.usageCount} 次
                                        {vehicle.lastUsed && (
                                            <span className="ml-2">
                                                · 最后使用{" "}
                                                {new Date(vehicle.lastUsed).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CRMVehiclePicker;
