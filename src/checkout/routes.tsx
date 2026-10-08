import type { RouteObject } from "react-router-dom";

import CheckoutConfirmationPage from "./pages/CheckoutConfirmationPage";
import CheckoutPage from "./pages/CheckoutPage";

export const checkoutProtectedRoutes: RouteObject[] = [
  { path: "/checkout", element: <CheckoutPage /> },
  {
    path: "/checkout/confirmation/:reference",
    element: <CheckoutConfirmationPage />,
  },
];
