import { Navigate, Outlet } from "react-router-dom";

import { useRegistration } from "../contexts/Registration/useRegistration";

const RegisterProtectedRoute = () => {
  const { email } = useRegistration();

  if (!email) {
    return <Navigate to="/register/enter-email" replace />;
  }

  return <Outlet />;
};

export default RegisterProtectedRoute;
