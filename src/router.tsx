import { createBrowserRouter } from "react-router-dom";

import RootLayout from "@/layout/RootLayout";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/", element: <HomePage /> },
    ],
  },
]);
