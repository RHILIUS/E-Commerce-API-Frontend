import type React from "react";

export type User = {
  id: number;
  fullName: string;
  email: string;
};

export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
  logout: () => void;
};
