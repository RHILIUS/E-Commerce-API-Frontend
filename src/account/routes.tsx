import type { RouteObject } from "react-router-dom";

import UserAccountPage from "./pages/UserAccountPage";

export const accountProtectedRoutes: RouteObject[] = [
  { path: "/account", element: <UserAccountPage /> },
];
