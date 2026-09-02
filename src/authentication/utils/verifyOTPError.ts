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

  const validationErrors = error.response.data.otp ?? error.response.data.email;

  return validationErrors?.join(" ") ?? "Unable to verify the code.";
};
