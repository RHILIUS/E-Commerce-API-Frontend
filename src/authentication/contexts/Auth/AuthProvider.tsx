import type React from "react";
import { useState } from "react";

import { loginApi } from "@/authentication/api";

import type { User } from "./AuthContext";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isAuthenticated = accessToken !== null;

  const logout = () => {
    setAccessToken(null);
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    const response = await loginApi(email, password);

    setAccessToken(response.access);
    setUser(response.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated,
        setUser,
        setAccessToken,
        logout,
        isLoading,
        setIsLoading,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
