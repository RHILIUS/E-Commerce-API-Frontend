import { createBrowserRouter } from "react-router-dom";

import RootLayout from "@/layout/RootLayout";
import LoginPage from "@/pages/LoginPage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [{ path: "login", element: <LoginPage /> }],
  },
]);
