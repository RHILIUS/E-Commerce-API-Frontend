import axios from "axios";

import { type SendOTPApiError, type SendOTPValidationError } from "../api";

export const getSendOTPErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError<SendOTPApiError | SendOTPValidationError>(error)) {
    return "Something went wrong. Please try again.";
  }

  if (!error.response) {
    return "Unable to connect. Check your internet connection and try again.";
  }

  const data = error.response.data;

  // Type narrowing error SendOTPValidationError type
  if ("email" in data) {
    const emailError = data.email;

    if (Array.isArray(emailError)) {
      return emailError.join(" ");
    }

    return emailError;
  }

  // Type narrowing SendOTPApiError
  if ("detail" in data) {
    return data.detail;
  }

  return "Unable to send the verification code. Please try again.";
};

export const getRetryAfterSeconds = (error: unknown) => {
  if (!axios.isAxiosError<SendOTPApiError>(error)) {
    return null;
  }

  if (error.response?.status !== 429 && error.response?.status !== 503) {
    return null;
  }

  return error.response.data.retry_after;
};
