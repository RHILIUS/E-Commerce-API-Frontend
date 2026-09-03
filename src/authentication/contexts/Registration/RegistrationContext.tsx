import { createContext } from "react";

export type RegistrationContextType = {
  email: string | null;
  cooldownEndsAt: number | null;

  beginRegistration: (email: string, retryAfter: number) => void;

  // Restarts the OTP cooldown
  startOtpCooldown: (retryAfter: number) => void;

  // Clears the registration email and OTP cooldown
  clearRegistration: () => void;
};

export const RegistrationContext = createContext<
  RegistrationContextType | undefined
>(undefined);
