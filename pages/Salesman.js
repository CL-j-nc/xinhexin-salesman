import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
// Salesman.tsx
import { useState, useRef } from 'react';
import { MAIN_COVERAGES, NEV_ADDONS, CoverageGroup } from '../config/coverages.js';
const ID_TYPES = [
    { value: '居民身份证', label: '居民身份证' },
    { value: '营业执照', label: '营业执照' },
    { value: '护照', label: '护照' },
    { value: '港澳台通行证', label: '港澳台通行证' },
];
const VEHICLE_USE_NATURE_OPTIONS = [
    { value: '出租营运客车', label: '出租营运客车' },
    { value: '预约出租客运', label: '预约出租客运' },
    { value: '租赁营运客车', label: '租赁营运客车' },
    { value: '营业货车', label: '营业货车' },
    { value: '非营业货车', label: '非营业货车' }
];
const steps = [
    { id: 'proposer', title: '1. 投保人' },
    { id: 'insured', title: '2. 被保险人' },
    { id: 'vehicle', title: '3. 投保车辆' },
    { id: 'coverages', title: '4. 险种选择' },
];
const Salesman = () => {
    const [data, setData] = useState({
        proposer: {
            name: '',
            idType: '居民身份证',
            idCard: '',
            mobile: '',
            address: '',
            idImage: '',
            principalName: '',
            principalIdCard: '',
            principalAddress: '',
            principalIdImage: '',
            verifyCode: '',
            verified: false
        },
        insured: {
            name: '',
            idType: '居民身份证',
            idCard: '',
            mobile: '',
            address: '',
            idImage: '',
            principalName: '',
            principalIdCard: '',
            principalAddress: '',
            principalIdImage: ''
        },
        vehicle: {
            plate: '',
            owner: '',
            vin: '',
            engineNo: '',
            brand: '',
            registerDate: '',
            vehicleType: '',
            useNature: '',
            curbWeight: '',
            approvedLoad: '',
            approvedPassengers: '',
            licenseImage: '',
            energyType: 'FUEL'
        },
        coverages: [
            { type: 'third_party', level: '100万' },
            { type: 'damage', level: '按新车购置价' }
        ]
    });
    const [activeStep, setActiveStep] = useState(0);
    const [expandedCoverages, setExpandedCoverages] = useState(['third_party', 'damage']);
    const [nevAddonSelected, setNevAddonSelected] = useState([]);
    const [internalPolicyId, setInternalPolicyId] = useState(''); // 仅内部使用，不展示
    const [status, setStatus] = useState('DRAFT');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [queryList, setQueryList] = useState([]);
    const coverageOptions = MAIN_COVERAGES[data.vehicle.energyType];
    const isSubmitted = status !== 'DRAFT';
    const handleInputChange = (section, field, value) => {
        setData(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    };
    const handleFileChange = (section, field, file) => {
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (e) => {
            handleInputChange(section, field, e.target?.result);
        };
        reader.readAsDataURL(file);
    };
    const removeFile = (section, field) => {
        handleInputChange(section, field, '');
    };
    const toggleExpand = (id) => {
        setExpandedCoverages(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    // 新能源附加险工具函数
    const hasDamageCoverage = data.coverages.some((c) => c.type === 'damage');
    const syncNevAddons = (selected) => {
        setData((prev) => {
            // 移除所有旧的新能源附加险
            const filtered = prev.coverages.filter(c => !NEV_ADDONS.some(a => a.id === c.type));
            // 重新写入附加险
            const addons = NEV_ADDONS
                .filter((a) => !a.selectable || selected.includes(a.id))
                .map((a) => ({
                type: a.id,
                addon: true,
                selectable: a.selectable
            }));
            return {
                ...prev,
                coverages: [...filtered, ...addons]
            };
        });
    };
    const updateCoverageLevel = (type, level) => {
        setData((prev) => {
            const next = [...prev.coverages];
            const idx = next.findIndex(c => c.type === type);
            if (idx >= 0) {
                next[idx].level = level;
            }
            else {
                next.push({ type, level });
            }
            const nextState = { ...prev, coverages: next };
            // 新能源 + 车损险 → 同步附加险
            if (data.vehicle.energyType === 'NEV') {
                if (type === 'damage') {
                    syncNevAddons(nevAddonSelected);
                }
            }
            return nextState;
        });
    };
    const handleSubmit = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const response = await fetch('https://xinhexin-api.chinalife-shiexinhexin.workers.dev/api/application/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`提交失败，状态码：${response.status}`);
            }
            const result = await response.json();
            setInternalPolicyId(result.applicationNo);
            setStatus('SUBMITTED');
            alert('投保单已提交核保');
        }
        catch (error) {
            console.error('提交失败：', error);
            setErrorMsg('提交失败，请检查网络或必填项是否完整');
        }
        finally {
            setLoading(false);
        }
    };
    const renderPersonSection = (type, title) => {
        const person = data[type];
        const isBusiness = person.idType === '营业执照';
        return (_jsxs("div", { className: "space-y-6 animate-fadeIn", children: [_jsxs("h2", { className: "text-xl font-bold text-slate-800", children: [title, "\u8D44\u6599"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [_jsx(Input, { label: "\u59D3\u540D / \u540D\u79F0", value: person.name, onChange: v => handleInputChange(type, 'name', v), disabled: isSubmitted }), _jsx(Select, { label: "\u8BC1\u4EF6\u7C7B\u578B", value: person.idType, options: ID_TYPES, onChange: v => handleInputChange(type, 'idType', v), disabled: isSubmitted }), _jsx(Input, { label: "\u8BC1\u4EF6\u53F7\u7801", value: person.idCard, onChange: v => handleInputChange(type, 'idCard', v), disabled: isSubmitted }), _jsx(Input, { label: "\u8054\u7CFB\u7535\u8BDD", value: person.mobile, onChange: v => handleInputChange(type, 'mobile', v), disabled: isSubmitted }), type === 'proposer' && (_jsxs(_Fragment, { children: [_jsx(Input, { label: "\u624B\u673A\u9A8C\u8BC1\u7801", value: person.verifyCode || '', onChange: v => handleInputChange(type, 'verifyCode', v), disabled: isSubmitted }), _jsx("div", { className: "flex items-center text-sm text-slate-500 mt-2", children: _jsx("span", { children: person.verified ? (_jsx("span", { className: "text-emerald-600", children: "\u624B\u673A\u53F7\u5DF2\u9A8C\u8BC1" })) : (_jsx("span", { className: "text-rose-500", children: "\u624B\u673A\u53F7\u672A\u9A8C\u8BC1" })) }) })] })), _jsx("div", { className: "md:col-span-2", children: _jsx(Input, { label: "\u8BE6\u7EC6\u5730\u5740", value: person.address, onChange: v => handleInputChange(type, 'address', v), disabled: isSubmitted }) }), isBusiness && (_jsxs("div", { className: "md:col-span-2 bg-slate-50/70 p-6 rounded-2xl border border-slate-100 space-y-5 animate-fadeIn", children: [_jsxs("h3", { className: "text-sm font-semibold text-slate-700 flex items-center gap-2", children: [_jsx("span", { className: "w-1.5 h-1.5 bg-emerald-600 rounded-full" }), "\u4F01\u4E1A\u8D1F\u8D23\u4EBA\u4FE1\u606F"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [_jsx(Input, { label: "\u8D1F\u8D23\u4EBA\u59D3\u540D", value: person.principalName || '', onChange: v => handleInputChange(type, 'principalName', v), disabled: isSubmitted }), _jsx(Input, { label: "\u8D1F\u8D23\u4EBA\u8BC1\u4EF6\u53F7\u7801", value: person.principalIdCard || '', onChange: v => handleInputChange(type, 'principalIdCard', v), disabled: isSubmitted }), _jsx("div", { className: "md:col-span-2", children: _jsx(Input, { label: "\u8D1F\u8D23\u4EBA\u5730\u5740", value: person.principalAddress || '', onChange: v => handleInputChange(type, 'principalAddress', v), disabled: isSubmitted }) }), _jsx("div", { className: "md:col-span-2", children: _jsx(UploadZone, { value: person.principalIdImage || '', onChange: file => handleFileChange(type, 'principalIdImage', file), onRemove: () => removeFile(type, 'principalIdImage'), label: "\u8D1F\u8D23\u4EBA\u7B2C\u4E8C\u4EE3\u5C45\u6C11\u8EAB\u4EFD\u8BC1", disabled: isSubmitted }) })] })] })), _jsx("div", { className: "md:col-span-2", children: _jsx(UploadZone, { value: person.idImage || '', onChange: file => handleFileChange(type, 'idImage', file), onRemove: () => removeFile(type, 'idImage'), label: isBusiness ? '营业执照整本' : '证件正反面（可多张）', disabled: isSubmitted }) })] })] }));
    };
    return (_jsx("div", { className: `min-h-screen ${data.vehicle.energyType === 'NEV'
            ? 'bg-gradient-to-b from-emerald-100 via-emerald-50 to-white'
            : 'bg-slate-50/60'}`, children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12", children: [_jsxs("header", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 border-b border-slate-200", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("img", { src: "/logo-a.png", alt: "\u7CFB\u7EDF Logo", className: "h-10 w-auto object-contain" }), _jsxs("div", { className: "flex flex-col", children: [_jsx("h1", { className: "text-xl font-black text-slate-800 tracking-tight", children: "\u65B0\u6838\u5FC3\u627F\u4FDD\u7CFB\u7EDF" }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: "\u4E0A\u6D77\u4FDD\u4EA4\u6240 \u00B7 \u8F66\u9669\u597D\u6295\u4FDD\u5E73\u53F0\u652F\u6301" })] })] }), !isSubmitted && (_jsx("button", { onClick: handleSubmit, disabled: loading || isSubmitted, className: `
                btn-primary px-10 py-3 mt-4 sm:mt-0
                ${loading ? 'btn-loading' : ''}
              `, children: loading ? '提交中…' : '提交核保' }))] }), _jsxs("div", { className: "relative py-8", children: [_jsx("div", { className: "absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2" }), _jsx("div", { className: "relative flex justify-between", children: steps.map((step, idx) => {
                                const isActive = activeStep === idx;
                                const isDone = activeStep > idx;
                                return (_jsxs("button", { onClick: () => !isSubmitted && setActiveStep(idx), className: `
                    flex-1 flex flex-col items-center text-sm font-medium
                    ${isActive ? 'text-emerald-600' : isDone ? 'text-slate-600' : 'text-slate-400'}
                    ${isSubmitted && !isActive ? 'cursor-default' : 'cursor-pointer'}
                  `, children: [_jsx("div", { className: `
                    w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold mb-2
                    ${isActive ? 'border-emerald-600 bg-emerald-50 text-emerald-600' :
                                                isDone ? 'border-slate-300 bg-slate-100 text-slate-500' :
                                                    'border-slate-200 text-slate-300'}
                  `, children: idx + 1 }), step.title, isDone && _jsx("span", { className: "absolute -top-1 text-emerald-600 text-xs", children: "\u2713" })] }, step.id));
                            }) })] }), _jsxs("div", { className: "bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 min-h-[500px]", children: [activeStep === 0 && renderPersonSection('proposer', '投保人'), activeStep === 1 && renderPersonSection('insured', '被保险人'), activeStep === 2 && (_jsxs("div", { className: "space-y-6 animate-fadeIn", children: [_jsx("h2", { className: "text-xl font-bold text-slate-800", children: "\u8F66\u8F86\u4FE1\u606F\u91C7\u96C6" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [_jsx(Select, { label: "\u8F66\u8F86\u7C7B\u578B", value: data.vehicle.energyType, options: [
                                                { value: 'FUEL', label: '燃油车' },
                                                { value: 'NEV', label: '新能源车' }
                                            ], onChange: v => {
                                                handleInputChange('vehicle', 'energyType', v);
                                                // 切换车型时，清空新能源附加险
                                                if (v !== 'NEV') {
                                                    setNevAddonSelected([]);
                                                    setData(prev => ({
                                                        ...prev,
                                                        coverages: prev.coverages.filter(c => !NEV_ADDONS.some(a => a.id === c.type))
                                                    }));
                                                }
                                            }, disabled: isSubmitted }), _jsx(Input, { label: "\u53F7\u724C\u53F7\u7801", value: data.vehicle.plate, onChange: v => handleInputChange('vehicle', 'plate', v), disabled: isSubmitted }), _jsx(Input, { label: "\u8F66\u8F86\u6240\u6709\u4EBA", value: data.vehicle.owner || '', onChange: v => handleInputChange('vehicle', 'owner', v), disabled: isSubmitted }), _jsx(Input, { label: "\u54C1\u724C\u578B\u53F7", value: data.vehicle.brand, onChange: v => handleInputChange('vehicle', 'brand', v), disabled: isSubmitted }), _jsx(Input, { label: "\u8F66\u67B6\u53F7 (VIN)\u7801", value: data.vehicle.vin, onChange: v => handleInputChange('vehicle', 'vin', v), disabled: isSubmitted }), _jsx(Input, { label: "\u53D1\u52A8\u673A\u53F7", value: data.vehicle.engineNo, onChange: v => handleInputChange('vehicle', 'engineNo', v), disabled: isSubmitted }), _jsx(Input, { label: "\u521D\u6B21\u767B\u8BB0\u65E5\u671F", value: data.vehicle.registerDate, onChange: v => handleInputChange('vehicle', 'registerDate', v), disabled: isSubmitted }), _jsx(Input, { label: "\u6574\u5907\u8D28\u91CF (kg)", value: data.vehicle.curbWeight || '', onChange: v => handleInputChange('vehicle', 'curbWeight', v), disabled: isSubmitted }), _jsx(Input, { label: "\u6838\u5B9A\u8F7D\u8D28\u91CF (kg)", value: data.vehicle.approvedLoad || '', onChange: v => handleInputChange('vehicle', 'approvedLoad', v), disabled: isSubmitted }), _jsx(Input, { label: "\u6838\u5B9A\u8F7D\u5BA2\u4EBA\u6570 (\u4EBA)", value: data.vehicle.approvedPassengers || '', onChange: v => handleInputChange('vehicle', 'approvedPassengers', v), disabled: isSubmitted }), _jsxs("div", { className: "relative", children: [_jsx(Select, { label: "\u8F66\u8F86\u4F7F\u7528\u6027\u8D28", value: data.vehicle.useNature || '', options: VEHICLE_USE_NATURE_OPTIONS, onChange: v => handleInputChange('vehicle', 'useNature', v), disabled: isSubmitted, required: true }), _jsxs("div", { className: "absolute right-2 top-8 group", children: [_jsx("div", { className: "w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center cursor-pointer", children: "?" }), _jsx("div", { className: "absolute right-0 mt-2 w-72 bg-black text-white text-xs rounded-md p-3 opacity-0 group-hover:opacity-100 transition pointer-events-none z-50", children: "\u4EC5\u652F\u6301\u51FA\u79DF\uFF08\u542B\u9884\u7EA6\u51FA\u79DF\u5BA2\u8FD0\uFF09\u3001\u8425\u4E1A\u5BA2\u8F66\u3001\u79DF\u8D41\u8425\u8FD0\u5BA2\u8F66\u3001\u8425\u4E1A\u8D27\u8F66\u548C\u975E\u8425\u4E1A\u8D27\u8F66\u8FDB\u884C\u6295\u4FDD\u767B\u8BB0\u3002" })] })] }), _jsx("div", { className: "md:col-span-2", children: _jsx(UploadZone, { value: data.vehicle.licenseImage || '', onChange: file => handleFileChange('vehicle', 'licenseImage', file), onRemove: () => removeFile('vehicle', 'licenseImage'), label: "\u884C\u9A76\u8BC1 /\u8F66\u8F86\u51FA\u5382\u5408\u683C\u8BC1/\u8D2D\u8F66\u53D1\u7968\uFF08\u652F\u6301\u591A\u5F20\u4E0A\u4F20\uFF09", disabled: isSubmitted }) })] })] })), queryList.length > 0 && (_jsx("div", { className: "mt-4 overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-sm border border-slate-200", children: [_jsx("thead", { className: "bg-slate-100", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 border", children: "\u6295\u4FDD\u5355\u53F7" }), _jsx("th", { className: "px-3 py-2 border", children: "\u72B6\u6001" }), _jsx("th", { className: "px-3 py-2 border", children: "\u63D0\u4EA4\u65F6\u95F4" }), _jsx("th", { className: "px-3 py-2 border", children: "\u4FDD\u5355\u53F7" })] }) }), _jsx("tbody", { children: queryList.map(row => (_jsxs("tr", { children: [_jsx("td", { className: "px-3 py-2 border", children: row.applicationNo }), _jsx("td", { className: "px-3 py-2 border", children: row.status }), _jsx("td", { className: "px-3 py-2 border", children: row.applyAt }), _jsx("td", { className: "px-3 py-2 border", children: row.policyNo || '-' })] }, row.applicationNo))) })] }) })), activeStep === 3 && (_jsxs("div", { className: "space-y-6 animate-fadeIn", children: [_jsx("h2", { className: "text-xl font-bold text-slate-800", children: "\u9669\u79CD\u521D\u6B65\u9009\u62E9" }), _jsx("p", { className: "text-sm text-slate-500", children: "\u6838\u5FC3\u9669\u79CD\u9ED8\u8BA4\u5C55\u5F00\uFF0C\u53EF\u9009\u9669\u79CD\u70B9\u51FB\u6807\u9898\u5C55\u5F00\u6DFB\u52A0\u3002" }), _jsx("div", { className: "space-y-3", children: coverageOptions.map((opt) => {
                                        const cov = data.coverages.find((c) => c.type === opt.id) || { type: opt.id, level: opt.levels[0] };
                                        const expanded = expandedCoverages.includes(opt.id);
                                        return (_jsxs("div", { className: "bg-slate-50/60 rounded-xl overflow-hidden border border-slate-100", children: [_jsxs("button", { type: "button", onClick: () => !isSubmitted && toggleExpand(opt.id), className: `
                          w-full px-5 py-4 text-left font-semibold text-slate-700 flex justify-between items-center
                          ${expanded ? 'bg-slate-100/70' : ''}
                        `, children: [opt.name, _jsx("span", { className: `transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`, children: "\u25BC" })] }), _jsxs("div", { className: `px-5 pb-5 transition-all duration-300 ease-out ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`, children: [isSubmitted ? (_jsx("div", { className: "py-3 text-slate-600 font-medium", children: cov.level })) : (_jsx("select", { value: cov.level, onChange: e => updateCoverageLevel(opt.id, e.target.value), className: "w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none transition", children: opt.levels.map((lv) => _jsx("option", { value: lv, children: lv }, lv)) })), data.vehicle.energyType === 'NEV' && opt.group === CoverageGroup.DAMAGE && (_jsx("div", { className: "mt-3 space-y-2 pl-4 border-l border-emerald-200", children: NEV_ADDONS.map(addon => (_jsxs("label", { className: `flex items-center gap-2 text-sm ${addon.selectable ? 'text-slate-700' : 'text-slate-400'}`, children: [_jsx("input", { type: "checkbox", disabled: !addon.selectable, checked: addon.selectable
                                                                            ? nevAddonSelected.includes(addon.id)
                                                                            : true, onChange: e => {
                                                                            if (!addon.selectable)
                                                                                return;
                                                                            const next = e.target.checked
                                                                                ? [...nevAddonSelected, addon.id]
                                                                                : nevAddonSelected.filter(x => x !== addon.id);
                                                                            setNevAddonSelected(next);
                                                                            syncNevAddons(next);
                                                                        } }), addon.name] }, addon.id))) }))] })] }, opt.id));
                                    }) })] }))] }), _jsxs("div", { className: "mt-8 flex justify-between items-center pt-6 border-t border-slate-200", children: [_jsx("button", { onClick: () => setActiveStep(Math.max(0, activeStep - 1)), disabled: activeStep === 0 || isSubmitted, className: "px-6 py-2.5 rounded-xl border border-slate-300 text-slate-600 disabled:opacity-40", children: "\u4E0A\u4E00\u6B65" }), activeStep < steps.length - 1 ? (_jsx("button", { onClick: () => setActiveStep(Math.min(steps.length - 1, activeStep + 1)), disabled: isSubmitted, className: "px-8 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50", children: "\u4E0B\u4E00\u6B65" })) : !isSubmitted && (_jsx("button", { onClick: handleSubmit, disabled: loading || isSubmitted, className: `
                btn-primary px-10 py-3
                ${loading ? 'btn-loading' : ''}
              `, children: loading ? '提交中…' : '提交核保' })), isSubmitted && (_jsx("div", { className: "text-emerald-700 font-medium", children: "\u5DF2\u63D0\u4EA4\u6838\u4FDD" })), errorMsg && (_jsx("div", { className: "text-rose-600 text-sm font-medium ml-4", children: errorMsg }))] })] }) }));
};
// Input 组件
const Input = ({ label, value, onChange, disabled, error, required = false }) => (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "block text-xs font-bold text-slate-400 uppercase tracking-wider", children: [label, required && _jsx("span", { className: "text-rose-400 ml-1", children: "*" })] }), _jsx("input", { type: "text", value: value, onChange: e => onChange(e.target.value), disabled: disabled, className: `
        input-base
        ${disabled ? 'input-disabled' : ''}
        ${error ? 'input-error' : ''}
        ${!disabled && !error ? 'focus:input-focus' : ''}
      ` }), error && _jsx("p", { className: "error-text", children: error })] }));
// Select 组件
const Select = ({ label, value, options, onChange, disabled, error, required }) => (_jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "block text-xs font-bold text-slate-400 uppercase tracking-wider", children: [label, required && _jsx("span", { className: "text-rose-400 ml-1", children: "*" })] }), _jsx("select", { value: value, onChange: e => onChange(e.target.value), disabled: disabled, className: `
        appearance-none
        input-base
        ${disabled ? 'input-disabled' : ''}
        ${error ? 'input-error' : ''}
        ${!disabled && !error ? 'focus:input-focus' : ''}
      `, children: options.map(o => _jsx("option", { value: o.value, children: o.label }, o.value)) }), error && _jsx("p", { className: "error-text", children: error })] }));
const UploadZone = ({ value, onChange, onRemove, label, disabled, error }) => {
    const inputRef = useRef(null);
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-xs font-bold text-slate-400 uppercase tracking-wider", children: label }), _jsxs("div", { className: `
        relative h-40 rounded-xl border-2 transition-colors duration-200
        ${value ? 'border-slate-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50'}
        ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-300/70'}
        ${error ? 'border-rose-400 bg-rose-50/10' : ''}
      `, children: [value ? (_jsxs("div", { className: "group relative h-full", children: [_jsx("img", { src: value, alt: "\u9884\u89C8", className: "h-full w-full object-contain p-3" }), !disabled && (_jsx("button", { onClick: onRemove, className: "absolute top-2 right-2 bg-white shadow rounded-full w-7 h-7 flex items-center justify-center text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity", children: "\u00D7" }))] })) : (_jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-slate-500", children: [_jsx("div", { className: "text-sm font-medium", children: label }), _jsx("div", { className: "text-xs mt-1 opacity-70", children: "\u70B9\u51FB\u6216\u62D6\u62FD\u4E0A\u4F20\uFF08jpg / png / pdf\uFF09" })] })), !disabled && (_jsx("input", { ref: inputRef, type: "file", accept: "image/jpeg,image/png,application/pdf", className: "absolute inset-0 opacity-0 cursor-pointer z-10", onChange: e => {
                            const file = e.target.files?.[0];
                            if (file)
                                onChange(file);
                            e.target.value = '';
                        } }))] }), error && _jsx("p", { className: "error-text", children: error })] }));
};
export default Salesman;
