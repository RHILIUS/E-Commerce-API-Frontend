import { useContext } from "react";

import { RegistrationContext } from "./RegistrationContext";

export const useRegistration = () => {
  const context = useContext(RegistrationContext);

  if (context === undefined) {
    throw new Error("useRegistration must be used inside RegistrationProvider");
  }

  return context;
};
