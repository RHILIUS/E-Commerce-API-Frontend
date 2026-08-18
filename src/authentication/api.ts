import api from "@/app/api/axios";

export const login = async (email: string, password: string) => {
  const response = await api.post("/api/auth/login/", { email, password });

  return response.data;
};
