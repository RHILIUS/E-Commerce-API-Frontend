# Account profile

The Profile tab is the default view at `/account`; `/account?tab=recipients`
opens delivery recipients. The Figma canvas remains unchanged.

The form displays the existing profile picture, username and email, and edits
full name, phone number and personal address. Phone and address country choices
are independent, using the shared registration/recipient controls. Country,
address line 1 and city are required; line 2, region and postal code are optional.
The layout stacks on narrow screens and uses paired fields on wider screens.

GET `/api/account/profile/` loads the profile. PUT sends the complete editable
profile and nested address atomically. The saved response updates the form and
AuthContext full name and address country, allowing existing country-dependent
catalog/cart/checkout consumers to refresh. Delivery recipients and saved
purchases remain independent. See the [backend contract](../../../backend/docs/account/profile-api.md).

Validation errors appear beside their fields and preserve the draft. Failed loads
provide retry. An uncertain save reloads the server profile before another save;
if reloading also fails, the draft is preserved. Saving disables form controls and
blocks duplicate submissions. Cancel restores the saved values. Switching tabs
reloads the selected section and discards unsaved profile edits.

Username and email are read-only. Photo upload and square cropping require a
separate backend upload/crop flow and remain deferred, as does phone verification.
