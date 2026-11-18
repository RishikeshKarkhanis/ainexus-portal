import { useEffect, useState } from "react";
import { ShieldCheck, Search, Plus, LoaderCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { adminApiRequest } from "../../lib/api";

function AdminManager() {
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    setError("");

    try {
      const data = await adminApiRequest("/api/admin/management/admins");
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to fetch administrators.");
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    const query = search.trim();

    if (query.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;

    const searchUsers = async () => {
      setSearching(true);
      setError("");

      try {
        const data = await adminApiRequest(`/api/admin/management/search?q=${encodeURIComponent(query)}`);

        if (!cancelled) {
          setResults(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to search users.");
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    };

    const timeout = setTimeout(searchUsers, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search]);

  const handleAddAdmin = async (userId) => {
    setAddingId(userId);
    setError("");
    setSuccess("");

    try {
      await adminApiRequest(`/api/admin/management/${userId}/promote`, { method: "PATCH" });

      setSuccess("Administrator added successfully.");
      setSearch("");
      setResults([]);

      await fetchAdmins();
    } catch (err) {
      setError(err.message || "Unable to add administrator.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={23} className="text-gray-700" />
          <h2 className="text-2xl font-semibold text-gray-900">Manage Admins</h2>
        </div>

        <p className="mt-1 text-sm text-gray-500">Manage administrator access for AI Nexus.</p>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      {/* Search users */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="font-semibold text-gray-900">Add an Administrator</h3>

        <p className="mt-1 text-sm text-gray-500">Search existing users by name or email.</p>

        <div className="relative mt-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-gray-400" />
        </div>

        {search.trim().length > 0 && search.trim().length < 2 && <p className="mt-2 text-xs text-gray-400">Enter at least 2 characters.</p>}

        {searching && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <LoaderCircle size={16} className="animate-spin" />
            Searching users...
          </div>
        )}

        {!searching && search.trim().length >= 2 && (
          <div className="mt-3 divide-y divide-gray-100">
            {results.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">No eligible users found.</p>
            ) : (
              results.map((user) => (
                <div key={user.userId} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>

                  <button onClick={() => handleAddAdmin(user.userId)} disabled={addingId !== null} title="Make administrator" className="shrink-0 rounded-lg bg-gray-900 p-2 text-white transition hover:bg-gray-700 disabled:opacity-50">
                    {addingId === user.userId ? <LoaderCircle size={18} className="animate-spin" /> : <Plus size={18} />}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Current admins */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900">Current Administrators</h3>
          <p className="mt-1 text-sm text-gray-500">
            {admins.length} administrator{admins.length !== 1 ? "s" : ""}
          </p>
        </div>

        {loadingAdmins ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-gray-500">
            <LoaderCircle size={18} className="animate-spin" />
            Loading administrators...
          </div>
        ) : admins.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No administrators found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 text-right font-medium">Access</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {admins.map((admin) => (
                  <tr key={admin.userId} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">{admin.name}</td>

                    <td className="px-5 py-4 text-gray-500">{admin.email}</td>

                    <td className="px-5 py-4 text-right">
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Admin</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminManager;
