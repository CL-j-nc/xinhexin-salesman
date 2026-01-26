import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Entry from "./pages/Entry";
import EnergySelect from "./pages/EnergySelect";
import Salesman from "./pages/Salesman";
import StatusList from "./pages/StatusList";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Entry />} />
        <Route path="/apply" element={<EnergySelect />} />
        <Route path="/apply/form" element={<Salesman />} />
        <Route path="/history" element={<StatusList />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
