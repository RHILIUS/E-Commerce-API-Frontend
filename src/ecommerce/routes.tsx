import type { RouteObject } from "react-router-dom";

import CartPage from "./pages/CartPage";
import LandingPage from "./pages/LandingPage";
import ProductPage from "./pages/ProductPage";
import StorePage from "./pages/StorePage";
import UserOrdersPage from "./pages/UserOrdersPage";

export const ecommercePublicRoutes: RouteObject[] = [
  { path: "/", element: <LandingPage /> },
  { path: "/products/:productId", element: <ProductPage /> },
  { path: "/stores/:storeId", element: <StorePage /> },
];

export const ecommerceProtectedRoutes: RouteObject[] = [
  { path: "/cart", element: <CartPage /> },
  { path: "/orders", element: <UserOrdersPage /> },
];
