import { createContext } from "react";

export type User = {
  id: number;
  fullName: string;
  email: string;
  address_country_code: string | null;
};

export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  didLogOut: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
