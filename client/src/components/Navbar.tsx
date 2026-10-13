import { signOut, useSession } from "@/lib/auth-client";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { data: session } = useSession();
  const navigate = useNavigate();

  if (!session) return null;

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-primary">Helpdesk</Link>
          {(session.user as { role?: string }).role === "admin" && (
            <Link to="/users" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Users
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {session.user.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              signOut({
                fetchOptions: {
                  onSuccess: () => navigate("/login"),
                },
              })
            }
          >
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  );
}
