import type { RouteObject } from "react-router-dom";

import CheckoutConfirmationPage from "./pages/CheckoutConfirmationPage";
import CheckoutPage from "./pages/CheckoutPage";
import StripePaymentPage from "./pages/StripePaymentPage";

export const checkoutProtectedRoutes: RouteObject[] = [
  { path: "/checkout", element: <CheckoutPage /> },
  { path: "/checkout/payment/:reference", element: <StripePaymentPage /> },
  {
    path: "/checkout/confirmation/:reference",
    element: <CheckoutConfirmationPage />,
  },
];
