// Salesman.tsx
import React, { useState, useRef } from 'react';
import { InsuranceData } from '../../utils/codec.js';
import { MAIN_COVERAGES, NEV_ADDONS, CoverageGroup } from '../../config/coverages.js';


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

const Salesman: React.FC = () => {
  const [data, setData] = useState<InsuranceData>({
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
  const [expandedCoverages, setExpandedCoverages] = useState<string[]>(['third_party', 'damage']);
  const [nevAddonSelected, setNevAddonSelected] = useState<string[]>([]);
  const [internalPolicyId, setInternalPolicyId] = useState<string>(''); // 仅内部使用，不展示
  const [status, setStatus] = useState<'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'>('DRAFT');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [queryList, setQueryList] = useState<any[]>([]);
  const coverageOptions = MAIN_COVERAGES[data.vehicle.energyType as 'FUEL' | 'NEV'];

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

  // 新能源附加险工具函数
  const hasDamageCoverage = data.coverages.some((c: any) => c.type === 'damage');

  const syncNevAddons = (selected: string[]) => {
    setData((prev: InsuranceData) => {
      // 移除所有旧的新能源附加险
      const filtered = prev.coverages.filter(
        c => !NEV_ADDONS.some(a => a.id === c.type)
      );

      // 重新写入附加险
      const addons = NEV_ADDONS
        .filter((a: any) => !a.selectable || selected.includes(a.id))
        .map((a: any) => ({
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

  const updateCoverageLevel = (type: string, level: string) => {
    setData((prev: InsuranceData) => {
      const next = [...prev.coverages];
      const idx = next.findIndex(c => c.type === type);
      if (idx >= 0) {
        next[idx].level = level;
      } else {
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

  const validateFormData = (): string | null => {
    // 投保人信息校验
    if (!data.proposer.name) return '请填写投保人姓名';
    if (!data.proposer.idCard) return '请填写投保人证件号码';
    if (!data.proposer.mobile) return '请填写投保人联系电话';
    if (!data.proposer.address) return '请填写投保人详细地址';

    // 被保险人信息校验
    if (!data.insured.name) return '请填写被保险人姓名';
    if (!data.insured.idCard) return '请填写被保险人证件号码';
    if (!data.insured.mobile) return '请填写被保险人联系电话';

    // 投保车辆校验
    if (!data.vehicle.plate) return '请填写车牌号';
    if (!data.vehicle.vin) return '请填写VIN号';
    if (!data.vehicle.engineNo) return '请填写发动机号';
    if (!data.vehicle.brand) return '请选择车辆品牌';
    if (!data.vehicle.registerDate) return '请填写注册日期';
    if (!data.vehicle.useNature) return '请选择车辆使用性质';

    // 险种校验
    if (!data.coverages || data.coverages.length === 0) return '请至少选择一个险种';

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateFormData();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      console.log('开始提交投保单，数据:', data);

      const response = await fetch(
        'https://xinhexin-api.chinalife-shiexinhexin.workers.dev/api/application/apply',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'omit',
          body: JSON.stringify(data)
        }
      );

      console.log('API 响应状态:', response.status);
      console.log('API 响应头:', {
        'content-type': response.headers.get('content-type'),
        'access-control-allow-origin': response.headers.get('access-control-allow-origin')
      });

      const result = await response.json();
      console.log('API 返回数据:', result);

      if (!response.ok) {
        throw new Error(result.error || `提交失败，状态码：${response.status}`);
      }

      setInternalPolicyId(result.applicationNo);
      setStatus('SUBMITTED');
      alert('投保单已提交核保');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('提交失败：', errorMsg);
      console.error('完整错误信息：', error);
      setErrorMsg(`提交失败: ${errorMsg}`);
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
          {/* 手机验证码和验证状态，仅投保人展示 */}
          {type === 'proposer' && (
            <>
              <Input
                label="手机验证码"
                value={person.verifyCode || ''}
                onChange={v => handleInputChange(type, 'verifyCode', v)}
                disabled={isSubmitted}
              />
              <div className="flex items-center text-sm text-slate-500 mt-2">
                <span>
                  {person.verified ? (
                    <span className="text-emerald-600">手机号已验证</span>
                  ) : (
                    <span className="text-rose-500">手机号未验证</span>
                  )}
                </span>
              </div>
            </>
          )}
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
    <div
      className={`min-h-screen ${data.vehicle.energyType === 'NEV'
        ? 'bg-gradient-to-b from-emerald-100 via-emerald-50 to-white'
        : 'bg-slate-50/60'
        }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img
              src="/logo-a.png"
              alt="系统 Logo"
              className="h-10 w-auto object-contain"
            />
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                新核心承保系统
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                上海保交所 · 车险好投保平台支持
              </p>
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

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium animate-fadeIn">
            ⚠️ {errorMsg}
          </div>
        )}

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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 min-h-[500px]">
          {activeStep === 0 && renderPersonSection('proposer', '投保人')}
          {activeStep === 1 && renderPersonSection('insured', '被保险人')}
          {activeStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-800">车辆信息采集</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="车辆类型"
                  value={data.vehicle.energyType}
                  options={[
                    { value: 'FUEL', label: '燃油车' },
                    { value: 'NEV', label: '新能源车' }
                  ]}
                  onChange={v => {
                    handleInputChange('vehicle', 'energyType', v);

                    // 切换车型时，清空新能源附加险
                    if (v !== 'NEV') {
                      setNevAddonSelected([]);
                      setData(prev => ({
                        ...prev,
                        coverages: prev.coverages.filter(
                          c => !NEV_ADDONS.some(a => a.id === c.type)
                        )
                      }));
                    }
                  }}
                  disabled={isSubmitted}
                />
                <Input label="号牌号码" value={data.vehicle.plate} onChange={v => handleInputChange('vehicle', 'plate', v)} disabled={isSubmitted} />
                <Input label="车辆所有人" value={data.vehicle.owner || ''} onChange={v => handleInputChange('vehicle', 'owner', v)} disabled={isSubmitted} />
                <Input label="品牌型号" value={data.vehicle.brand} onChange={v => handleInputChange('vehicle', 'brand', v)} disabled={isSubmitted} />
                <Input label="车架号 (VIN)码" value={data.vehicle.vin} onChange={v => handleInputChange('vehicle', 'vin', v)} disabled={isSubmitted} />
                <Input label="发动机号" value={data.vehicle.engineNo} onChange={v => handleInputChange('vehicle', 'engineNo', v)} disabled={isSubmitted} />
                <Input label="初次登记日期" value={data.vehicle.registerDate} onChange={v => handleInputChange('vehicle', 'registerDate', v)} disabled={isSubmitted} />
                <Input label="整备质量 (kg)" value={data.vehicle.curbWeight || ''} onChange={v => handleInputChange('vehicle', 'curbWeight', v)} disabled={isSubmitted} />
                <Input label="核定载质量 (kg)" value={data.vehicle.approvedLoad || ''} onChange={v => handleInputChange('vehicle', 'approvedLoad', v)} disabled={isSubmitted} />
                <Input label="核定载客人数 (人)" value={data.vehicle.approvedPassengers || ''} onChange={v => handleInputChange('vehicle', 'approvedPassengers', v)} disabled={isSubmitted} />
                <div className="relative">
                  <Select
                    label="车辆使用性质"
                    value={data.vehicle.useNature || ''}
                    options={VEHICLE_USE_NATURE_OPTIONS}
                    onChange={v => handleInputChange('vehicle', 'useNature', v)}
                    disabled={isSubmitted}
                    required
                  />
                  {/* 问号提示 */}
                  <div className="absolute right-2 top-8 group">
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center cursor-pointer">
                      ?
                    </div>
                    <div className="absolute right-0 mt-2 w-72 bg-black text-white text-xs rounded-md p-3 opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                      仅支持出租（含预约出租客运）、营业客车、租赁营运客车、营业货车和非营业货车进行投保登记。
                    </div>
                  </div>
                </div>
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
          {queryList.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm border border-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 border">投保单号</th>
                    <th className="px-3 py-2 border">状态</th>
                    <th className="px-3 py-2 border">提交时间</th>
                    <th className="px-3 py-2 border">保单号</th>
                  </tr>
                </thead>
                <tbody>
                  {queryList.map(row => (
                    <tr key={row.applicationNo}>
                      <td className="px-3 py-2 border">{row.applicationNo}</td>
                      <td className="px-3 py-2 border">{row.status}</td>
                      <td className="px-3 py-2 border">{row.applyAt}</td>
                      <td className="px-3 py-2 border">{row.policyNo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-800">险种初步选择</h2>
              <p className="text-sm text-slate-500">核心险种默认展开，可选险种点击标题展开添加。</p>
              <div className="space-y-3">
                {coverageOptions.map((opt: any) => {
                  const cov = data.coverages.find((c: any) => c.type === opt.id) || { type: opt.id, level: opt.levels[0] };
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
                            {opt.levels.map((lv: string) => <option key={lv} value={lv}>{lv}</option>)}
                          </select>
                        )}
                        {/* 新能源附加险区域 */}
                        {data.vehicle.energyType === 'NEV' && opt.group === CoverageGroup.DAMAGE && (
                          <div className="mt-3 space-y-2 pl-4 border-l border-emerald-200">
                            {NEV_ADDONS.map(addon => (
                              <label
                                key={addon.id}
                                className={`flex items-center gap-2 text-sm ${addon.selectable ? 'text-slate-700' : 'text-slate-400'
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={!addon.selectable}
                                  checked={
                                    addon.selectable
                                      ? nevAddonSelected.includes(addon.id)
                                      : true
                                  }
                                  onChange={e => {
                                    if (!addon.selectable) return;

                                    const next = e.target.checked
                                      ? [...nevAddonSelected, addon.id]
                                      : nevAddonSelected.filter(x => x !== addon.id);

                                    setNevAddonSelected(next);
                                    syncNevAddons(next);
                                  }}
                                />
                                {addon.name}
                              </label>
                            ))}
                          </div>
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
