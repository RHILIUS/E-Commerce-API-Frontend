import { createBrowserRouter } from "react-router-dom";

import { accountProtectedRoutes } from "@/account/routes";
import RootLayout from "@/app/layout/RootLayout";
import HomePage from "@/app/pages/HomePage";
import NotFoundPage from "@/app/pages/NotFoundPage";
import { authenticationRoutes } from "@/authentication/routes";
import { checkoutProtectedRoutes } from "@/checkout/routes";
import {
  ecommerceProtectedRoutes,
  ecommercePublicRoutes,
} from "@/ecommerce/routes";

import ProtectedRoute from "./routes/ProtectedRoute";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Authentication
      ...authenticationRoutes,

      // Public Ecommerce Routes
      ...ecommercePublicRoutes,

      // Unsupported URLs are public, including nested paths.
      { path: "*", element: <NotFoundPage /> },

      // Protected
      {
        element: <ProtectedRoute />,
        children: [
          ...accountProtectedRoutes,
          ...ecommerceProtectedRoutes,
          ...checkoutProtectedRoutes,
          { path: "/home-test", element: <HomePage /> },
        ],
      },
    ],
  },
]);
