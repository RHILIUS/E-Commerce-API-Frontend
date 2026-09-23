import { createBrowserRouter } from "react-router-dom";

import RootLayout from "@/app/layout/RootLayout";
import HomePage from "@/app/pages/HomePage";
import { authenticationRoutes } from "@/authentication/routes";
import { ecommercePublicRoutes } from "@/ecommerce/routes";

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
        children: [{ path: "/home-test", element: <HomePage /> }],
      },
    ],
  },
]);
