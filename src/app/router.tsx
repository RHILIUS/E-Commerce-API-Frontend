import { createBrowserRouter } from "react-router-dom";

import RootLayout from "@/app/layout/RootLayout";
import HomePage from "@/app/pages/HomePage";
import LoginPage from "@/app/pages/LoginPage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/", element: <HomePage /> },
    ],
  },
]);
