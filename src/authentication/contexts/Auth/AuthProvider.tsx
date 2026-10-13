import type React from "react";
import { useEffect, useRef, useState } from "react";

import { loginApi, logoutApi } from "@/authentication/api";
import { useAxiosInterceptor } from "@/authentication/hooks/useAxiosInterceptor";

import type { User } from "./AuthContext";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [didLogOut, setDidLogOut] = useState(false);
  const initialized = useRef(false);
  const isAuthenticated = accessToken !== null;
  const { refreshAccessToken, clearSession } = useAxiosInterceptor({
    accessToken,
    setAccessToken,
    setUser,
  });

  const endSession = () => {
    setDidLogOut(true);
    clearSession();
  };

  const logout = async () => {
    // Tell the route guard to discard the return destination for intentional logout.
    endSession();
    try {
      await logoutApi();
    } catch {
      // Backend logout failure doesn't prevent local logout.
    }
  };

  const login = async (email: string, password: string) => {
    clearSession();
    const response = await loginApi(email, password);

    setAccessToken(response.access);
    setUser(response.user);
    setDidLogOut(false);
  };

  useEffect(() => {
    // Avoid rotating the refresh token twice in development under Strict Mode.
    if (initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      try {
        await refreshAccessToken();
      } catch {
        // Without a valid refresh cookie, protected routes navigate to LoginPage.
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshAccessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated,
        didLogOut,
        setUser,
        setAccessToken,
        logout,
        endSession,
        isLoading,
        setIsLoading,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
