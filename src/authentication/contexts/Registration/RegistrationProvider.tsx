import { type ReactNode, useState } from "react";

import { RegistrationContext } from "./RegistrationContext";

export const RegistrationProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);

  // Restarts the OTP cooldown
  const startOtpCooldown = (retryAfter: number) => {
    setCooldownEndsAt(Date.now() + retryAfter * 1000);
  };

  // Initializes the registration email and starts the OTP cooldown
  const beginRegistration = (email: string, retryAfter: number) => {
    setEmail(email);
    startOtpCooldown(retryAfter);
  };

  // Clears the registration email and OTP cooldown
  const clearRegistration = () => {
    setEmail(null);
    setCooldownEndsAt(null);
  };

  return (
    <RegistrationContext.Provider
      value={{
        email,
        cooldownEndsAt,
        beginRegistration,
        startOtpCooldown,
        clearRegistration,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};
