declare global {
  type Pokemon = {
    name: string;
    url: string;
    image?: string;
  };

  type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: string[];
  };

  type AuthContextType = {
    loading: boolean;
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
  };
}
