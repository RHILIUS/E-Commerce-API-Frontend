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

type VerifyOTPResponse = {
  message: string;
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

export const verifyOTPApi = async (
  email: string,
  otp: string,
): Promise<VerifyOTPResponse> => {
  const response = await api.post<VerifyOTPResponse>("/api/auth/verify-otp/", {
    email,
    otp,
  });

  return response.data;
};
