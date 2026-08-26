import { Outlet } from "react-router-dom";

const RootLayout = () => {
  return (
    <div className="bg-background text-foreground grid min-h-svh w-full">
      <Outlet />
    </div>
  );
};

export default RootLayout;
