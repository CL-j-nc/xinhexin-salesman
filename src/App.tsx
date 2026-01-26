// src/App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Menu from './pages/index.tsx'         // ← 加 .tsx
import Salesman from './pages/Salesman.tsx'   // ← 加 .tsx
import Query from './pages/Query.tsx'         // ← 加 .tsx

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/apply" element={<Salesman />} />
        <Route path="/salesman/apply" element={<Salesman />} />
        <Route path="/query" element={<Query />} />
        <Route path="/salesman/query" element={<Query />} />
        {/* 404 部分不变 */}
      </Routes>
    </Router>
  )
}

export default App