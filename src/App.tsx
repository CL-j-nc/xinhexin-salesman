import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Apply from "./pages/Apply";
import ApplyForm from "./pages/ApplyForm";
import Status from "./pages/Status";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Apply />} />
        <Route path="/apply" element={<ApplyForm />} />
        <Route path="/status" element={<Status />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
