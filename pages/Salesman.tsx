// Salesman.tsx
import React, { useState, useRef } from 'react';
import { InsuranceData } from '../utils/codec';

const ID_TYPES = [
  { value: '居民身份证', label: '居民身份证' },
  { value: '营业执照', label: '营业执照' },
  { value: '护照', label: '护照' },
  { value: '港澳台通行证', label: '港澳台通行证' },
];

const COVERAGE_OPTIONS = [
  {
    id: 'third_party',
    name: '机动车第三者责任保险',
    levels: ['100万', '150万', '200万', '300万', '500万'],
    default: true,
  },
  {
    id: 'damage',
    name: '机动车损失保险',
    levels: ['按新车购置价', '按折旧价值'],
    default: true,
  },
  {
    id: 'driver',
    name: '机动车车上人员责任保险-驾驶人',
    levels: ['1万', '2万', '3万', '5万', '10万', '15万', '20万'],
    default: false,
  },
  {
    id: 'passenger',
    name: '机动车车上人员责任保险-乘客',
    levels: ['1万', '2万', '3万', '5万', '10万', '15万', '20万'],
    default: false,
  },
];

const steps = [
  { id: 'proposer', title: '1. 投保人' },
  { id: 'insured', title: '2. 被保险人' },
  { id: 'vehicle', title: '3. 投保车辆' },
  { id: 'coverages', title: '4. 险种选择' },
];

const Salesman: React.FC = () => {
  const [data, setData] = useState<InsuranceData>({
    proposer: { name: '', idType: '居民身份证', idCard: '', mobile: '', address: '', idImage: '', principalName: '', principalIdCard: '', principalAddress: '', principalIdImage: '' },
    insured: { name: '', idType: '居民身份证', idCard: '', mobile: '', address: '', idImage: '', principalName: '', principalIdCard: '', principalAddress: '', principalIdImage: '' },
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
      licenseImage: ''
    },
    coverages: [
      { type: 'third_party', level: '300万' },
      { type: 'damage', level: '按新车购置价' }
    ]
  });

  const [activeStep, setActiveStep] = useState(0);
  const [expandedCoverages, setExpandedCoverages] = useState<string[]>(['third_party', 'damage']);
  const [internalPolicyId, setInternalPolicyId] = useState<string>(''); // 仅内部使用，不展示
  const [status, setStatus] = useState<'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'>('DRAFT');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isSubmitted = status !== 'DRAFT';

  const handleInputChange = (section: keyof InsuranceData, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      [section]: { ...(prev[section] as any), [field]: value }
    }));
  };

  const handleFileChange = (section: keyof InsuranceData, field: string, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      handleInputChange(section, field, e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (section: keyof InsuranceData, field: string) => {
    handleInputChange(section, field, '');
  };

  const toggleExpand = (id: string) => {
    setExpandedCoverages(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const updateCoverageLevel = (type: string, level: string) => {
    setData(prev => {
      const next = [...prev.coverages];
      const idx = next.findIndex(c => c.type === type);
      if (idx >= 0) {
        next[idx].level = level;
      } else {
        next.push({ type, level });
      }
      return { ...prev, coverages: next };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`提交失败，状态码：${response.status}`);
      }

      const result = await response.json();
      setInternalPolicyId(result.policyId); // 只保存，不展示
      setStatus('SUBMITTED');
      alert('投保单已提交核保');
    } catch (error) {
      console.error('提交失败：', error);
      setErrorMsg('提交失败，请检查网络或必填项是否完整');
    } finally {
      setLoading(false);
    }
  };

  const renderPersonSection = (type: 'proposer' | 'insured', title: string) => {
    const person = data[type];
    const isBusiness = person.idType === '营业执照';

    return (
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-xl font-bold text-slate-800">{title}资料</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="姓名 / 名称" value={person.name} onChange={v => handleInputChange(type, 'name', v)} disabled={isSubmitted} />
          <Select label="证件类型" value={person.idType} options={ID_TYPES} onChange={v => handleInputChange(type, 'idType', v)} disabled={isSubmitted} />
          <Input label="证件号码" value={person.idCard} onChange={v => handleInputChange(type, 'idCard', v)} disabled={isSubmitted} />
          <Input label="联系电话" value={person.mobile} onChange={v => handleInputChange(type, 'mobile', v)} disabled={isSubmitted} />
          <div className="md:col-span-2">
            <Input label="详细地址" value={person.address} onChange={v => handleInputChange(type, 'address', v)} disabled={isSubmitted} />
          </div>

          {isBusiness && (
            <div className="md:col-span-2 bg-slate-50/70 p-6 rounded-2xl border border-slate-100 space-y-5 animate-fadeIn">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                企业负责人信息
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="负责人姓名" value={person.principalName || ''} onChange={v => handleInputChange(type, 'principalName', v)} disabled={isSubmitted} />
                <Input label="负责人证件号码" value={person.principalIdCard || ''} onChange={v => handleInputChange(type, 'principalIdCard', v)} disabled={isSubmitted} />
                <div className="md:col-span-2">
                  <Input label="负责人地址" value={person.principalAddress || ''} onChange={v => handleInputChange(type, 'principalAddress', v)} disabled={isSubmitted} />
                </div>
                <div className="md:col-span-2">
                  <UploadZone
                    value={person.principalIdImage || ''}
                    onChange={file => handleFileChange(type, 'principalIdImage', file)}
                    onRemove={() => removeFile(type, 'principalIdImage')}
                    label="负责人第二代居民身份证"
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <UploadZone
              value={person.idImage || ''}
              onChange={file => handleFileChange(type, 'idImage', file)}
              onRemove={() => removeFile(type, 'idImage')}
              label={isBusiness ? '营业执照整本' : '证件正反面（可多张）'}
              disabled={isSubmitted}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 relative">
              <svg viewBox="0 0 28 28" className="w-full h-full">
                <path d="M14 3 L25 9 L25 19 L14 25 L3 19 L3 9 Z" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="14" cy="14" r="5" fill="#10b981" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">上海保交所 - 国寿财险核心承保系统</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">中国人寿车险 - 投保信息采集</p>
            </div>
          </div>

          {!isSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={loading || isSubmitted}
              className={`
                btn-primary px-10 py-3 mt-4 sm:mt-0
                ${loading ? 'btn-loading' : ''}
              `}
            >
              {loading ? '提交中…' : '提交核保'}
            </button>
          )}
        </header>

        {/* Steps */}
        <div className="relative py-8">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2" />
          <div className="relative flex justify-between">
            {steps.map((step, idx) => {
              const isActive = activeStep === idx;
              const isDone = activeStep > idx;
              return (
                <button
                  key={step.id}
                  onClick={() => !isSubmitted && setActiveStep(idx)}
                  className={`
                    flex-1 flex flex-col items-center text-sm font-medium
                    ${isActive ? 'text-emerald-600' : isDone ? 'text-slate-600' : 'text-slate-400'}
                    ${isSubmitted && !isActive ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold mb-2
                    ${isActive ? 'border-emerald-600 bg-emerald-50 text-emerald-600' :
                      isDone ? 'border-slate-300 bg-slate-100 text-slate-500' :
                        'border-slate-200 text-slate-300'}
                  `}>
                    {idx + 1}
                  </div>
                  {step.title}
                  {isDone && <span className="absolute -top-1 text-emerald-600 text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 min-h-[500px]">
          {activeStep === 0 && renderPersonSection('proposer', '投保人')}
          {activeStep === 1 && renderPersonSection('insured', '被保险人')}
          {activeStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-800">车辆信息采集</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="号牌号码" value={data.vehicle.plate} onChange={v => handleInputChange('vehicle', 'plate', v)} disabled={isSubmitted} />
                <Input label="车辆所有人" value={data.vehicle.owner || ''} onChange={v => handleInputChange('vehicle', 'owner', v)} disabled={isSubmitted} />
                <Input label="品牌型号" value={data.vehicle.brand} onChange={v => handleInputChange('vehicle', 'brand', v)} disabled={isSubmitted} />
                <Input label="车架号 (VIN)码" value={data.vehicle.vin} onChange={v => handleInputChange('vehicle', 'vin', v)} disabled={isSubmitted} />
                <Input label="发动机号" value={data.vehicle.engineNo} onChange={v => handleInputChange('vehicle', 'engineNo', v)} disabled={isSubmitted} />
                <Input label="初次登记日期" value={data.vehicle.registerDate} onChange={v => handleInputChange('vehicle', 'registerDate', v)} disabled={isSubmitted} />
                <Input label="整备质量 (kg)" value={data.vehicle.curbWeight} onChange={v => handleInputChange('vehicle', 'curbWeight', v)} disabled={isSubmitted} />
                <Input label="核定载质量 (kg)" value={data.vehicle.approvedLoad} onChange={v => handleInputChange('vehicle', 'approvedLoad', v)} disabled={isSubmitted} />
                <Input label="核定载客人数 (人)" value={data.vehicle.approvedPassengers} onChange={v => handleInputChange('vehicle', 'approvedPassengers', v)} disabled={isSubmitted} />
                <Input label="使用性质" value={data.vehicle.useNature} onChange={v => handleInputChange('vehicle', 'useNature', v)} disabled={isSubmitted} />
                <div className="md:col-span-2">
                  <UploadZone
                    value={data.vehicle.licenseImage || ''}
                    onChange={file => handleFileChange('vehicle', 'licenseImage', file)}
                    onRemove={() => removeFile('vehicle', 'licenseImage')}
                    label="行驶证 /车辆出厂合格证/购车发票（支持多张上传）"
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            </div>
          )}
          {activeStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-800">险种初步选择</h2>
              <p className="text-sm text-slate-500">核心险种默认展开，可选险种点击标题展开添加。</p>
              <div className="space-y-3">
                {COVERAGE_OPTIONS.map(opt => {
                  const cov = data.coverages.find(c => c.type === opt.id) || { type: opt.id, level: opt.levels[0] };
                  const expanded = expandedCoverages.includes(opt.id);
                  return (
                    <div key={opt.id} className="bg-slate-50/60 rounded-xl overflow-hidden border border-slate-100">
                      <button
                        type="button"
                        onClick={() => !isSubmitted && toggleExpand(opt.id)}
                        className={`
                          w-full px-5 py-4 text-left font-semibold text-slate-700 flex justify-between items-center
                          ${expanded ? 'bg-slate-100/70' : ''}
                        `}
                      >
                        {opt.name}
                        <span className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      <div className={`px-5 pb-5 transition-all duration-300 ease-out ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        {isSubmitted ? (
                          <div className="py-3 text-slate-600 font-medium">{cov.level}</div>
                        ) : (
                          <select
                            value={cov.level}
                            onChange={e => updateCoverageLevel(opt.id, e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none transition"
                          >
                            {opt.levels.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-200">
          <button
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            disabled={activeStep === 0 || isSubmitted}
            className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-600 disabled:opacity-40"
          >
            上一步
          </button>

          {activeStep < steps.length - 1 ? (
            <button
              onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
              disabled={isSubmitted}
              className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              下一步
            </button>
          ) : !isSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={loading || isSubmitted}
              className={`
                btn-primary px-10 py-3
                ${loading ? 'btn-loading' : ''}
              `}
            >
              {loading ? '提交中…' : '提交核保'}
            </button>
          )}

          {isSubmitted && (
            <div className="text-emerald-700 font-medium">已提交核保</div>
          )}

          {errorMsg && (
            <div className="text-rose-600 text-sm font-medium ml-4">{errorMsg}</div>
          )}
        </div>

      </div>
    </div>
  );
};

// Input 组件
const Input = ({
  label,
  value,
  onChange,
  disabled,
  error,
  required = false
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
      {label}{required && <span className="text-rose-400 ml-1">*</span>}
    </label>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className={`
        input-base
        ${disabled ? 'input-disabled' : ''}
        ${error ? 'input-error' : ''}
        ${!disabled && !error ? 'focus:input-focus' : ''}
      `}
    />
    {error && <p className="error-text">{error}</p>}
  </div>
);

// Select 组件
const Select = ({ label, value, options, onChange, disabled, error, required }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
      {label}{required && <span className="text-rose-400 ml-1">*</span>}
    </label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className={`
        appearance-none
        input-base
        ${disabled ? 'input-disabled' : ''}
        ${error ? 'input-error' : ''}
        ${!disabled && !error ? 'focus:input-focus' : ''}
      `}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="error-text">{error}</p>}
  </div>
);

// UploadZone 组件
interface UploadZoneProps {
  value: string;
  onChange: (file: File | null) => void;
  onRemove: () => void;
  label: string;
  disabled: boolean;
  error?: string;
}

const UploadZone = ({ value, onChange, onRemove, label, disabled, error }: UploadZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
      <div className={`
        relative h-40 rounded-xl border-2 transition-colors duration-200
        ${value ? 'border-slate-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50'}
        ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-300/70'}
        ${error ? 'border-rose-400 bg-rose-50/10' : ''}
      `}>
        {value ? (
          <div className="group relative h-full">
            <img src={value} alt="预览" className="h-full w-full object-contain p-3" />
            {!disabled && (
              <button
                onClick={onRemove}
                className="absolute top-2 right-2 bg-white shadow rounded-full w-7 h-7 flex items-center justify-center text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <div className="text-sm font-medium">{label}</div>
            <div className="text-xs mt-1 opacity-70">点击或拖拽上传（jpg / png / pdf）</div>
          </div>
        )}

        {!disabled && (
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onChange(file);
              e.target.value = '';
            }}
          />
        )}
      </div>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

export default Salesman;
