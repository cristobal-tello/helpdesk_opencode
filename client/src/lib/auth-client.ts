import { createAuthClient } from "better-auth/react";

export const { signIn, signOut, useSession } = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "",
});
