import { Routes, Route } from "react-router";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";

import ProtectedRoute from "./components/ProtectedRoute";

function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#00001F] p-10 text-[#E8E5DF]">
      <h1 className="text-3xl font-bold">AI Nexus Admin Panel</h1>

      <p className="mt-3 text-[#AEBBD0]">Welcome to the administration dashboard.</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />

      {/* Authenticated routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Admin-only routes */}
      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
