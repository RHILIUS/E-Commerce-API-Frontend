import { useState } from "react";

import { useAuth } from "@/authentication/contexts/Auth/useAuth";

import { Button } from "../components/ui/button";

const HomePage = () => {
  const auth = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await auth.logout();
    } catch {
      // pass error, we would be navigated to LoginPage anyways
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Button onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? "Logging Out...." : "Logout"}
      </Button>
    </div>
  );
};
export default HomePage;
