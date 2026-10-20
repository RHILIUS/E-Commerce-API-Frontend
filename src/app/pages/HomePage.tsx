import { useState } from "react";

import { SimpleHeader } from "@/app/components/SimpleHeader";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";

import { Button } from "../components/ui/button";

const HomePage = () => {
  const auth = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await auth.logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col">
      <SimpleHeader />
      <main className="flex flex-1 items-center justify-center">
        <Button onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? "Logging Out...." : "Logout"}
        </Button>
      </main>
    </div>
  );
};
export default HomePage;
