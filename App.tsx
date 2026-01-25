import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 主菜单页面（根据你的实际文件名调整）
import Menu from './pages/index';          // 如果菜单文件是 index.tsx
// import Menu from './pages/Menu';      // 如果是 Menu.tsx，请取消这行注释并注释上面一行

import Salesman from './pages/Salesman';
import Query from './pages/Query';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 根路径显示主菜单 */}
        <Route path="/" element={<Menu />} />

        {/* 投保信息录入 */}
        <Route path="/apply" element={<Salesman />} />
        <Route path="/salesman/apply" element={<Salesman />} />  {/* 兼容旧路径 */}

        {/* 历史投保记录查询 */}
        <Route path="/query" element={<Query />} />
        <Route path="/salesman/query" element={<Query />} />  {/* 兼容旧路径 */}

        {/* 404 兜底 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-slate-700">页面不存在</h1>
                <a href="/" className="text-emerald-600 hover:underline text-lg">
                  返回首页
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;