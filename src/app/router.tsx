import { createBrowserRouter } from "react-router-dom";

import RootLayout from "@/app/layout/RootLayout";
import HomePage from "@/app/pages/HomePage";
import LoginPage from "@/authentication/pages/LoginPage";
import RegisterEmailPage from "@/authentication/pages/RegisterEmailPage";
import RegisterOTPPage from "@/authentication/pages/RegisterOTPPage";

import ProtectedRoute from "./routes/ProtectedRoute";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register/enter-email", element: <RegisterEmailPage /> },
      { path: "/register/verify-otp", element: <RegisterOTPPage /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: "/", element: <HomePage /> }],
      },
    ],
  },
]);
