import type React from "react";
import { useEffect, useState } from "react";

import { loginApi, logoutApi, refreshTokenApi } from "@/authentication/api";

import type { User } from "./AuthContext";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isAuthenticated = accessToken !== null;

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Backend logout failure doesn't prevent local logout.
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await loginApi(email, password);

    setAccessToken(response.access);
    setUser(response.user);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { access, user } = await refreshTokenApi();
        setAccessToken(access);
        setUser(user);
      } catch {
        // Catch the error and don't do anything, the page will be navigated to LoginPage anyways
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

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
