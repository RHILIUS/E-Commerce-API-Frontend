# Forgot password

Customers who cannot sign in can choose **Forgot password?** on Login, verify their email with a one-time password (OTP), and choose a new password. The email entered on Login is carried into the recovery form.

## Customer journey

1. Enter the account email and select Send code. The acknowledgement is the same for existing and unknown emails, so it does not reveal who has an account.
2. Enter the latest six-digit email code. Codes expire after five minutes. Resend becomes available after 60 seconds and replaces the previous code.
3. After verification, enter a new password and repeat it in Confirm password. Use 8–64 characters with uppercase and lowercase letters and a number. The backend also requires a password different from the current one.
4. After a confirmed save, Login displays success. Sign in using the new password. Existing login sessions are invalidated and a password-changed email is queued.

Account → Change Password remains a separate feature with its existing behavior.

## State and recovery

Email, code, password drafts and the current step stay in browser memory. Reloading or leaving the page starts the form again. Passwords and reset permission are not saved in local storage. The backend stores reset permission in a ten-minute, single-use HttpOnly cookie, which JavaScript cannot read.

The backend owns expiry, account eligibility and durable limits. Restarting the form or resending does not reset the failed-code budget. Five incorrect codes block further attempts until the email's 15-minute budget window ends. The interface displays retry timing; exhausted challenges return to email entry. Expired codes can be resent after cooldown. An invalid or expired reset permission requires email verification again.

Mismatched passwords and password-policy errors keep the draft so the customer can correct it. Busy controls prevent duplicate submissions. If the final response is lost or the server reports an uncertain save, the browser returns to Login without claiming success and without automatically submitting the password again. The customer can try signing in, then begin recovery again if needed.

An accepted email task does not guarantee inbox delivery. Check spam and use controlled resend if necessary. A queue failure may leave a prepared challenge and cooldown; the screen shows the retry delay.

## Requests and implementation

Each operation first obtains a CSRF token from `GET /api/auth/forgot-password/`. POST requests send that token in `X-CSRFToken`; browser cookies travel with the request. This protects cookie-authorized actions against requests from another site.

| POST suffix | Request fields                 | Purpose                                   |
| ----------- | ------------------------------ | ----------------------------------------- |
| `request/`  | `email`                        | Prepare and queue a code                  |
| `resend/`   | `email`, `challenge_id`        | Replace the code and challenge identifier |
| `verify/`   | `email`, `challenge_id`, `otp` | Consume the code and set reset permission |
| `confirm/`  | `new_password`                 | Save once using the reset cookie          |

All suffixes use `/api/auth/forgot-password/` as their prefix.

| File                                                                 | Responsibility                                                 |
| -------------------------------------------------------------------- | -------------------------------------------------------------- |
| [Page](../../src/authentication/pages/ForgotPasswordPage.tsx)        | Forms, password confirmation and accessible feedback           |
| [Recovery hook](../../src/authentication/hooks/usePasswordReset.ts)  | Step transitions, deadlines and request coordination           |
| [API client](../../src/authentication/passwordResetApi.ts)           | Exact request contract and CSRF bootstrap                      |
| [Error helper](../../src/authentication/utils/passwordResetError.ts) | Convert server errors into field feedback and recovery actions |

Read the [backend contract](../../../backend/docs/api/authentication/forgot-password.md) for server rules and the [shared process guide](../../../docs/specific-business-processes/guide/authentication/forgot-password.md) for the complete workflow. Sibling links assume the checkout layout explained in the [project README](../../README.md#where-this-repository-fits).
