import { Outlet } from "react-router-dom";

import { RegistrationProvider } from "../contexts/Registration/RegistrationProvider";

const RegistrationLayout = () => {
  return (
    <RegistrationProvider>
      <Outlet />
    </RegistrationProvider>
  );
};

export default RegistrationLayout;
