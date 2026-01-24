import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface ApplicationItem {
  applicationNo: string;
  status: string;
  // other fields...
}

type UnderwritingCategory = 'NORMAL' | 'SPECIAL';

const Underwriting = () => {
  const router = useRouter();
  const { applicationNo } = router.query;

  const [currentApp, setCurrentApp] = useState<ApplicationItem | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [underwritingCategory, setUnderwritingCategory] =
    useState<UnderwritingCategory>('NORMAL');

  useEffect(() => {
    if (applicationNo) {
      // fetch application data
    }
  }, [applicationNo]);

  const handleApprove = async () => {
    if (!currentApp) return;
    const coverages = []; // get coverages
    const premiumSummary = {}; // get premium summary

    const res = await fetch('/api/approve', {
      method: 'POST',
      body: JSON.stringify({
        applicationNo: currentApp.applicationNo,
        coverages,
        premiumSummary,
        underwritingCategory
      }),
    });

    if (res.ok) {
      setStatusMsg('核保通过');
    } else {
      setStatusMsg('核保失败');
    }
  };

  return (
    <div>
    { currentApp && (
      <div className= "bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm space-y-1" >
      {/* application readonly info */ }
    </div>
      )}

{/* 承保车辆类别裁定 */ }
{
  currentApp && (
    <div className="border border-slate-200 rounded-lg p-4 space-y-2" >
      <div className="text-sm font-semibold" > 承保车辆类别（核保裁定）</div>
        < div className = "flex gap-4 text-sm" >
          <label className="flex items-center gap-2" >
            <input
                type="radio"
  value = "NORMAL"
  checked = { underwritingCategory === 'NORMAL'
}
onChange = {() => setUnderwritingCategory('NORMAL')}
              />
机动车
  </label>
  < label className = "flex items-center gap-2" >
    <input
                type="radio"
value = "SPECIAL"
checked = { underwritingCategory === 'SPECIAL'}
onChange = {() => setUnderwritingCategory('SPECIAL')}
              />
特种车
  </label>
  </div>
  < div className = "text-xs text-slate-500" >
    核保人员根据行驶证、使用性质、车辆照片等信息裁定最终承保类别
      </div>
      </div>
      )}

<button onClick={ handleApprove }> 核保通过 </button>
  < div > { statusMsg } </div>
  </div>
  );
};

export default Underwriting;
