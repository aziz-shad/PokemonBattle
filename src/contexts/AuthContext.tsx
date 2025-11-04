import { createContext, useState, useEffect, use } from "react";
import type { ReactNode } from "react";

type AuthContextProviderProps = {
  children: ReactNode;
};
const AUTH_API_URL: string | undefined = import.meta.env
  .VITE_APP_AUTH_SERVER_URL as string | undefined;
if (!AUTH_API_URL)
  throw new Error("API URL is required, are you missing a .env file?");
const baseURL: string = `${AUTH_API_URL}/auth`;

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const fetchUser = async () => {
      try {
        const response = await fetch(`${baseURL}/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (alive) setUser(null);
          return;
        }
        const data = await response.json();
        if (alive) setUser(data);
      } catch (error) {
        console.error("Error fetching user:", error);
        if (alive) setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchUser();
    return () => {
      alive = false;
    };
  }, []);

  const logout = async () => {
    try {
      await fetch(`${baseURL}/logout`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (error) {
      // ignore network errors here
    } finally {
      setUser(null);
    }
  };

  const values: AuthContextType = {
    user,
    setUser,
    loading,
    logout,
  };

  return <AuthContext value={values}>{children}</AuthContext>;
};

export function useAuthContext() {
  const context = use(AuthContext);
  if (!context) {
    throw new Error(
      "useAuthContext must be used within an AuthContextProvider"
    );
  }
  return context;
}
