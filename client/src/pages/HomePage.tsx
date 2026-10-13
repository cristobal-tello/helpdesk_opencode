import { useSession } from "@/lib/auth-client";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Welcome back, {session?.user.name}.
      </p>
    </div>
  );
}
