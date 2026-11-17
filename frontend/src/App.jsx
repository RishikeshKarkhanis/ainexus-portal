import { Routes, Route } from "react-router";

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AdminPanelLogin from "./pages/AdminPanelLogin";
import AdminPanel from "./pages/AdminPanel";
import Events from "./pages/Events";
import Registration from "./pages/Registration";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:eventId/register" element={<Registration />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin-login" element={<AdminPanelLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Route>
    </Routes>
  );
}

export default App;
