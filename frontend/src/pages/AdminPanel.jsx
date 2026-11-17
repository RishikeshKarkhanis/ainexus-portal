import { useState } from "react";
import { useNavigate } from "react-router";
import { CalendarDays, Wallet, ShieldCheck, ClipboardCheck, LogOut, Menu, X } from "lucide-react";

import EventManager from "../components/features/EventManager";

const menuItems = [
  { id: "events", label: "Manage Events", icon: CalendarDays },
  { id: "funds", label: "Manage Funds", icon: Wallet },
  { id: "admins", label: "Manage Admins", icon: ShieldCheck },
  { id: "attendance", label: "Attendance", icon: ClipboardCheck },
];

function AdminPanel() {
  const [activeSection, setActiveSection] = useState("events");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUserId");
    navigate("/admin-login");
  };

  const activeItem = menuItems.find((item) => item.id === activeSection);

  const renderContent = () => {
    switch (activeSection) {
      case "events":
        return <EventManager />;

      case "funds":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Manage Funds</h2>
            <p className="mt-1 text-sm text-gray-500">Track and manage club finances.</p>
          </div>
        );

      case "admins":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Manage Admins</h2>
            <p className="mt-1 text-sm text-gray-500">Manage administrator access.</p>
          </div>
        );

      case "attendance":
        return (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Attendance</h2>
            <p className="mt-1 text-sm text-gray-500">View and manage event attendance.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 md:static ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex h-20 items-center justify-between border-b border-gray-100 px-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              AI Nexus
              <span className="font-normal text-gray-400"> · Admin</span>
            </h1>

            <p className="mt-0.5 text-xs text-gray-500">Management Portal</p>
          </div>

          <button className="text-gray-500 md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 px-4 pt-7">
          <p className="mb-3 px-3 text-[11px] font-semibold tracking-wider text-gray-400">MANAGEMENT</p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${isActive ? "bg-gray-100 font-medium text-black" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-gray-100 p-4">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-red-600 transition hover:bg-red-50">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="min-w-0 flex-1">
        <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button className="text-gray-600 md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-base font-semibold text-gray-900">{activeItem?.label}</h2>

              <p className="text-xs text-gray-500">AI Nexus Administration</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5">
            <ShieldCheck size={15} className="text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Administrator</span>
          </div>
        </header>

        <section className="p-5 sm:p-8">{renderContent()}</section>
      </main>
    </div>
  );
}

export default AdminPanel;
