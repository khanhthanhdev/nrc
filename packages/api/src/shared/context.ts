export interface AuthContextSession {
  session: {
    expiresAt: Date;
    id: string;
    userId: string;
  };
  user: {
    email: string;
    emailVerified: boolean;
    id: string;
    name: string;
  };
}

export interface Context {
  session: AuthContextSession | null;
}

export interface CreateContextOptions {
  session: AuthContextSession | null;
}

export const createContext = async (opts: CreateContextOptions): Promise<Context> => ({
  session: opts.session,
});
