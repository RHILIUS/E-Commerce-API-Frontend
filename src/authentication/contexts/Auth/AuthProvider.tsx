import type React from "react";
import { useState } from "react";

import { AuthContext } from "./AuthContext";
import type { User } from "./types";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const isAuthenticated = accessToken !== null;

  const logout = () => {
    setAccessToken(null);
    setUser(null);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
