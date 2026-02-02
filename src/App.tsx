import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Apply from "./pages/Apply";
import ApplyForm from "./pages/ApplyForm";
import Status from "./pages/Status";
import SiteFooter from "./components/SiteFooter";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col page-gradient">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Apply />} />
            <Route path="/apply" element={<ApplyForm />} />
            <Route path="/status" element={<Status />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <SiteFooter />
      </div>
    </BrowserRouter>
  );
};

export default App;
