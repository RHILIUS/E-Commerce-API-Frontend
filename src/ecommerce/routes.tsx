import type { RouteObject } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import ProductPage from "./pages/ProductPage";

export const ecommercePublicRoutes: RouteObject[] = [
  { path: "/", element: <LandingPage /> },
  { path: "/products/:productId", element: <ProductPage /> },
];
