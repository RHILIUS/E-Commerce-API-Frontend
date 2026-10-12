import { createBrowserRouter } from "react-router-dom";

import { accountProtectedRoutes } from "@/account/routes";
import RootLayout from "@/app/layout/RootLayout";
import HomePage from "@/app/pages/HomePage";
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
