import { describe, expect, test } from "vitest";

import { getRegistrationError } from "./registerError";
import { getRetryAfterSeconds, getSendOTPErrorMessage } from "./sendOTPError";
import { getVerificationErrorMessage } from "./verifyOTPError";

const axiosError = (status: number, data: unknown) => ({
  isAxiosError: true,
  response: { status, data },
});

describe("authentication API error mapping", () => {
  test("maps registration field errors and ignores unknown fields", () => {
    expect(
      getRegistrationError(
        axiosError(400, {
          email: ["This email is already registered."],
          username: ["This username is unavailable."],
          unknown: ["Must not be displayed."],
        }),
      ),
    ).toEqual({
      kind: "validation",
      fields: {
        email: "This email is already registered.",
        username: "This username is unavailable.",
      },
    });
  });

  test("recognizes an expired registration verification", () => {
    expect(
      getRegistrationError(
        axiosError(401, { detail: "Registration token is not valid" }),
      ),
    ).toEqual({ kind: "verification" });
  });

  test("maps OTP validation and throttling responses", () => {
    const error = axiosError(429, {
      email: ["Enter a valid email address."],
      retry_after: 45,
    });

    expect(getSendOTPErrorMessage(error)).toBe("Enter a valid email address.");
    expect(getRetryAfterSeconds(error)).toBe(45);
  });

  test("uses a connection message when an OTP request has no response", () => {
    expect(getSendOTPErrorMessage({ isAxiosError: true, request: {} })).toBe(
      "Unable to connect. Check your internet connection and try again.",
    );
  });

  test("combines OTP verification validation messages", () => {
    expect(
      getVerificationErrorMessage(
        axiosError(400, { otp: ["The code is invalid.", "Try again."] }),
      ),
    ).toBe("The code is invalid. Try again.");
  });
});
