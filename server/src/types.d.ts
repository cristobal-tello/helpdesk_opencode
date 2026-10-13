import type { auth } from "./auth";

type Session = typeof auth.$Infer.Session;

declare global {
  namespace Express {
    interface Request {
      session?: Session;
    }
  }
}

export interface AuthenticatedRequest extends Express.Request {
  session: Session;
}
