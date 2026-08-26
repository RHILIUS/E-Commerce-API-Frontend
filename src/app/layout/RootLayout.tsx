import { Outlet } from "react-router-dom";

const RootLayout = () => {
  return (
    <div className="bg-background text-foreground min-h-dvh w-full">
      <Outlet />
    </div>
  );
};

export default RootLayout;
