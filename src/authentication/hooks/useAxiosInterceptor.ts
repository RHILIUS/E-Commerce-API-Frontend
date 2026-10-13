import type { InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { useCallback, useEffect, useRef } from "react";

import api from "@/app/api/axios";
import type { AuthResponse } from "@/authentication/api";
import { refreshTokenApi } from "@/authentication/api";
import type { User } from "@/authentication/contexts/Auth/AuthContext";

type RetryableRequest = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type UseAxiosInterceptorProps = {
  accessToken: string | null;
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

// Auth endpoints must handle their own 401 responses without starting a refresh loop.
const isAuthRequest = (url?: string) => url?.startsWith("/api/auth/") ?? false;

/** Adds the access token to requests and refreshes it after an authentication failure. */
export const useAxiosInterceptor = ({
  accessToken,
  setAccessToken,
  setUser,
}: UseAxiosInterceptorProps) => {
  const accessTokenRef = useRef(accessToken);
  const sessionGeneration = useRef(0);
  const refreshRequestRef = useRef<Promise<AuthResponse> | null>(null);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const clearSession = useCallback(() => {
    sessionGeneration.current += 1;
    accessTokenRef.current = null;
    refreshRequestRef.current = null;
    setAccessToken(null);
    setUser(null);
  }, [setAccessToken, setUser]);

  const refreshAccessToken = useCallback(async () => {
    const generation = sessionGeneration.current;
    // Makes sure that simultaneous refresh requests reference one single promise
    if (!refreshRequestRef.current) {
      const pending = refreshTokenApi().finally(() => {
        if (refreshRequestRef.current === pending)
          refreshRequestRef.current = null;
      });
      refreshRequestRef.current = pending;
    }

    try {
      const response = await refreshRequestRef.current;
      if (generation !== sessionGeneration.current)
        throw new Error("Session changed.");
      accessTokenRef.current = response.access;
      setAccessToken(response.access);
      setUser(response.user);
      return response.access;
    } catch (error) {
      if (
        generation === sessionGeneration.current &&
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        accessTokenRef.current = null;
        setAccessToken(null);
        setUser(null);
      }
      throw error;
    }
  }, [setAccessToken, setUser]);

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (accessTokenRef.current && !isAuthRequest(config.url)) {
        config.headers.set("Authorization", `Bearer ${accessTokenRef.current}`);
      }
      return config;
    });

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        if (!axios.isAxiosError(error)) return Promise.reject(error);

        const request = error.config as RetryableRequest | undefined;
        if (
          error.response?.status !== 401 ||
          !request ||
          request._retry ||
          isAuthRequest(request.url) ||
          !accessTokenRef.current
        ) {
          return Promise.reject(error);
        }

        request._retry = true;
        const access = await refreshAccessToken();
        request.headers.set("Authorization", `Bearer ${access}`);
        return api(request);
      },
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshAccessToken]);

  return { refreshAccessToken, clearSession };
};
