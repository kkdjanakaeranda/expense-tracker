import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";

function App() {
  const location = useLocation();

  useEffect(() => {
    const pageTitles = {
      "/": "Login",
      "/register": "Create Account",
      "/dashboard": "Dashboard",
      "/settings": "Settings"
    };
    const pageTitle = pageTitles[location.pathname] || "Expense Tracker";

    document.title = `${pageTitle} | Expense Tracker`;
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default App;
