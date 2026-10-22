import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";

import RegistrationLayout from "./layout/RegistrationLayout";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LoginPage from "./pages/LoginPage";
import RegisterDetailsPage from "./pages/RegisterDetailsPage";
import RegisterEmailPage from "./pages/RegisterEmailPage";
import RegisterOTPPage from "./pages/RegisterOTPPage";
import RegisterProtectedRoute from "./routes/RegisterProtectedRoute";

export const authenticationRoutes: RouteObject[] = [
  // Login
  { path: "/login", element: <LoginPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },

  // Register
  {
    path: "/register",
    element: <RegistrationLayout />,
    children: [
      { index: true, element: <Navigate to="enter-email" replace /> },
      { path: "enter-email", element: <RegisterEmailPage /> },
      {
        element: <RegisterProtectedRoute />,
        children: [
          { path: "verify-otp", element: <RegisterOTPPage /> },
          {
            path: "account-details",
            element: <RegisterDetailsPage />,
          },
        ],
      },
    ],
  },
];
