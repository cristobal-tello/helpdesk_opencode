import { useEffect, useState } from "react";
import { Shield, User as UserIcon } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/users`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load users");
        const data = await res.json();
        return data.users;
      })
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Users</h1>
        <span className="text-sm text-muted-foreground">
          {users.length} {users.length === 1 ? "user" : "users"}
        </span>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-medium text-muted-foreground">
              <th className="h-12 px-4">Name</th>
              <th className="h-12 px-4">Email</th>
              <th className="h-12 px-4">Role</th>
              <th className="h-12 px-4 text-right">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                    style={{
                      backgroundColor: user.role === "admin" ? "var(--color-primary)" : "var(--color-muted)",
                      color: user.role === "admin" ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
                    }}
                  >
                    {user.role === "admin" ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}