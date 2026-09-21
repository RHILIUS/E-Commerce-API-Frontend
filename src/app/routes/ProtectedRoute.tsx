import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/authentication/contexts/Auth/useAuth";

const ProtectedRoute = () => {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return (
      <div className="text-destructive p-10 text-center text-sm">
        Loading...
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={auth.didLogOut ? null : { from: location }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
