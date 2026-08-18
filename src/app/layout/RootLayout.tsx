import { Outlet } from "react-router-dom";

const RootLayout = () => {
  return (
    <div className="dark bg-background text-foreground min-h-screen">
      <Outlet />
    </div>
  );
};

export default RootLayout;
