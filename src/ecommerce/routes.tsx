import type { RouteObject } from "react-router-dom";

import CartPage from "./pages/CartPage";
import LandingPage from "./pages/LandingPage";
import ProductPage from "./pages/ProductPage";
import UserOrdersPage from "./pages/UserOrdersPage";

export const ecommercePublicRoutes: RouteObject[] = [
  { path: "/", element: <LandingPage /> },
  { path: "/products/:productId", element: <ProductPage /> },
];

export const ecommerceProtectedRoutes: RouteObject[] = [
  { path: "/cart", element: <CartPage /> },
  { path: "/orders", element: <UserOrdersPage /> },
];
