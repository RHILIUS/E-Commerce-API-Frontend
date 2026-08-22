import api from "@/app/api/axios";

import type { User } from "./contexts/Auth/AuthContext";

type LoginResponse = {
  access: string;
  user: User;
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
  const response = await api.post("/api/auth/logout/");

  console.log(response);
};
