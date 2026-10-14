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

Username and email are read-only. Phone verification remains deferred.

## Profile photo management

Implemented on 2026-10-13. Photo actions use the separate
[photo API](../../../backend/docs/account/profile-photo-api.md) at
`/api/account/profile/photo/`, leaving the personal-details API unchanged.

- Upload, replace, remove, and re-crop an existing photo without re-uploading.
- Fixed square crop with drag positioning, keyboard arrow positioning, zoom, and
  a live circular preview; no rotation. Cancel discards only the photo editor.
- Static JPEG, PNG, and WebP uploads, limited to 5 MiB (shown as 5 MB in the UI).
  The backend validates decoded content and rejects animation, corruption, and
  images over 25 megapixels. Client checks provide early size/type feedback.
- The backend normalizes orientation, strips metadata, and encodes WebP at quality 85. It retains the full image composition at up to 2048 × 2048 for re-cropping and
  generates a separate 512 × 512 avatar. The retained original is optimized rather
  than a full-resolution copy.
- **Save photo** and confirmed removal are independent of **Save changes**. Neither
  operation remounts the personal-details form or discards unfinished edits.
- Photo loading failures have retry. Uncertain writes and stale-source errors
  reload the current photo and close the editor for review. If reload fails,
  actions wait for a successful reload. Saving disables editor actions and blocks
  duplicate writes. Broken avatar images use the existing icon placeholder.
- Re-cropping sends the source ID captured when the editor opened, preventing an
  old crop from being applied to a newly replaced source. Legacy photos without
  retained originals can be re-cropped and get an optimized source on first save.
- Original and avatar replacement/removal use the configured local or Azure
  storage lifecycle. Apply the backend's new authentication migration first.

`react-easy-crop` supplies drag/touch and keyboard crop interactions; the existing
Dialog and new shadcn Slider supply themed controls. Dialogs scroll within short
viewports. The Figma node registry records this implementation without a canvas
change or verified mapping.

## Account menu avatar

The shared header uses `AuthContext.user.profile_image`, provided by login and
session refresh. It displays the existing bundled `avatarImage` when no photo
exists or when the image fails to load. Confirmed photo loads, saves, removals and
recovery reloads synchronize that shared URL for the same user, preserving the
personal-details draft. Failed recovery reads retain the last confirmed shared
URL. No separate photo fetch is added to the header. See the maintained
[account-menu process](../../../docs/diagrams/specific-business-processes/account/account-menu-profile-photo.md).
