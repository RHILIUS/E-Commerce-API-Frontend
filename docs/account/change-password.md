# Change Password

Authenticated customers open `/account?tab=change-password` or select **Change
Password** on the account page. The feature requires the current password and
an email OTP before committing a new password.

The maintained [business-process diagrams](../../../docs/diagrams/specific-business-processes/account/change-password.md)
live in the central documentation repository. See the
[backend API contract](../../../backend/docs/api/account/change-password.md).

## Interface and lifecycle

The first step collects current, new and confirmed passwords, offers show/hide
controls and applies the existing registration password policy. The backend also
validates current/new passwords before sending a code. The second step displays
a masked email address, six-digit OTP input, expiry and resend countdowns, Back,
and Verify and change password. All devices are signed out after success.

Password and OTP values remain in component memory. Switching account tabs hides
the mounted form and preserves the current step, entered values, and original
expiry and cooldown deadlines. Returning does not request another code. Leaving
the account page, reloading, signing out, or changing accounts clears the form.
Back returns to the password details; another request creates a
new challenge, subject to the server cooldown and durable account limits.

`ChangePasswordPanel` composes the interface. `useChangePassword` owns challenge
requests and recovery, reusing `useCountdown`; `passwordApi.ts` defines the exact
contract and `passwordChangeError.ts` maps backend errors. Existing shadcn/ui
inputs, tabs, buttons and OTP slots use semantic theme tokens.

## Recovery and authentication

Field errors preserve the draft. An incorrect OTP can be retried within the
backend attempt budget. An expired code can be replaced; unavailable or exhausted
challenges restart the form. Resend clears the old input even when delivery fails,
since the backend already replaced the old code. Server `retry_after` controls
cooldowns after rate-limit or delivery errors.

Confirmation is never automatically replayed after an uncertain response. A lost
response or server error directs the user to sign in with an outcome-uncertain
message. A successful response commits the login route before clearing local
authentication, preserving the success message through the protected-route guard.
Session-generation checks discard refresh responses that finish after sign-out.

## Background email delivery

Request and resend success confirm broker acceptance of the verification email.
The OTP step tells customers the email is queued. A Celery worker checks current
challenge ownership, email and credential binding, consumption and expiry before
each delivery attempt. Temporary transport failures have bounded retries. Later
delivery failures do not produce a new API response; controlled resend remains
available after cooldown. There is no completion email after a password change.
