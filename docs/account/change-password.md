# Change Password

Signed-in customers open `/account?tab=change-password` or select **Change
Password** on the account page. They verify access to their account email before
choosing a new password.

The [backend contract](../../../backend/docs/api/account/change-password.md)
defines authorization, limits and session invalidation. The approved
[process guide](../../../docs/specific-business-processes/guide/account/change-password.md)
and [editable diagram](../../../docs/specific-business-processes/diagrams/account/change-password.drawio.svg)
explain the flow across the three sibling repositories.

## Customer experience

1. Show the masked, fixed account email and **Send verification code**. Opening
   the tab loads the destination; it does not send email. A loading failure offers
   **Try again**.
2. After requesting a code, show the six-digit input, expiry, and resend cooldown.
   **Verify code** exchanges the latest code for temporary permission; the
   password has not changed yet. Resend replaces both code and challenge ID.
3. Show new-password and confirmation fields after successful verification.
   Offer show/hide controls, check that both entries match, and apply the existing
   registration password policy. The backend independently validates the password
   and rejects reuse of the current password.
4. **Change password** saves once, signs out existing sessions, and returns to
   Login with a success message. The backend queues a password-changed notice.

Each stage has a heading and accessible field names and error associations.
Visible stage changes move focus to the heading; switching account tabs retains
normal tab focus. Existing controls and semantic theme tokens support both themes.

## Drafts, permission and navigation

Code and password values remain only in component memory. Switching account tabs
hides the mounted form and preserves its stage, inputs, and original deadlines.
Returning does not request another code. Leaving the account page, reloading,
signing out, or changing accounts discards the form. Restarting email verification
unmounts password inputs and clears drafts, while retaining any resend cooldown.

The backend supplies short-lived, single-use permission through a separate
HttpOnly cookie. JavaScript cannot read it. All operations remain authenticated;
a public recovery cookie cannot authorize this flow. Before each POST, the
frontend fetches a fresh CSRF token and sends it in `X-CSRFToken`, with cookies.
CSRF protects cookie-bearing actions from requests forged by another website.
The bootstrap request does not clear existing permission.

Countdowns use server expiry timestamps and `retry_after` values. The backend
remains authoritative if the browser reloads or its clock changes. Verification
permission expires after ten minutes. Once expired, saving is disabled and the
customer can restart verification.

## Errors and recovery

Incorrect codes allow correction while attempts remain. Expired codes require
resend. Unavailable challenges or permission restart email verification; exhausted
attempts retain the server's wait before issuance becomes available again.
Password-policy errors preserve the password form for correction.

Resend clears the old input immediately. If replacement has an uncertain response
or email queuing fails, restart issuance subject to the server cooldown, because
the old identifier may already be invalid. A lost verification response also
restarts rather than assuming permission was obtained. No operation automatically
resends an email after an uncertain response.

A bootstrap failure before final save preserves the draft because the save POST
has not started. An explicit CSRF rejection permits a deliberate retry with a
fresh bootstrap. The existing authenticated client may refresh and retry an
explicit 401, which rejects the request before mutation; failed refresh requires
sign-in.

A lost final-save response or server error returns to Login with an uncertain
message and never automatically replays the save. Only confirmed success displays
success. Login navigation commits before local authentication is cleared, so the
protected-route guard preserves the notice. Session-generation checks discard
late refresh responses after sign-out.

## Email delivery and implementation

Request/resend success confirms broker acceptance, not inbox delivery. The email
worker checks current challenge ownership, email and credential binding, code
consumption, and expiry before delivery. Temporary transport failures have bounded
retries. Controlled resend remains available if delivery later fails. Notification
failure after a successful save cannot undo the password change. There is no
outbox guaranteeing delivery.

`ChangePasswordPanel` composes the three stages; phase-local forms own sensitive
inputs. `useChangePassword` coordinates requests, recovery and deadlines using
`useCountdown`. `api/passwordApi.ts` models the revised contract directly, and
`utils/passwordChangeError.ts` maps field errors, waits and restart behavior.
`UserAccountPage` mounts the panel on its first visit and preserves it across tabs;
its account-keyed tab container discards state when the customer changes.

Frontend and backend revisions must be released together. Apply the backend's
state migration and restart email workers with matching source before using the
revised flow. Source implementation alone does not establish deployment or email
delivery readiness.
