import axios from "axios";

type VerifyOTPValidationError = {
  email?: string[];
  otp?: string[];
};

export const getVerificationErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError<VerifyOTPValidationError>(error)) {
    return "Something went wrong. Please try again.";
  }

  if (!error.response) {
    return "Unable to connect to the server. Please try again.";
  }

  const { otp, email } = error.response.data;
  const validationErrors = otp ?? email;

  if (Array.isArray(validationErrors)) {
    return validationErrors.join(" ");
  }

  if (typeof validationErrors === "string") {
    return validationErrors;
  }

  return "Unable to verify the code.";
};
