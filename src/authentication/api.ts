import api from "@/app/api/axios";

import type { User } from "./contexts/Auth/AuthContext";

type LoginResponse = {
  access: string;
  user: User;
};

type SendOTPResponse = {
  email: string;
  message: string;
  retry_after: number;
};

export type SendOTPApiError = {
  detail: string;
  retry_after: number;
};

export type SendOTPValidationError = {
  email: string[];
};

export const loginApi = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await api.post("/api/auth/login/", { email, password });

  return response.data;
};

export const refreshTokenApi = async (): Promise<LoginResponse> => {
  const response = await api.post("/api/auth/refresh/");

  return response.data;
};

export const logoutApi = async () => {
  await api.post("/api/auth/logout/");
};

export const sendOTPApi = async (email: string): Promise<SendOTPResponse> => {
  const response = await api.post<SendOTPResponse>("/api/auth/send-otp/", {
    email,
  });

  return response.data;
};
