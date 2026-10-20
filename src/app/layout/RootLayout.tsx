import { Outlet } from "react-router-dom";

import { Footer } from "@/app/components/Footer";

const RootLayout = () => {
  return (
    <div className="bg-background text-foreground flex min-h-svh w-full flex-col">
      <div className="grid min-w-0 flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default RootLayout;
