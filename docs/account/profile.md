# Account profile

The profile is the customer's personal information: their name, phone number,
personal address, and photo. A signed-in customer opens `/account` to reach the
Profile tab. The same account page has separate tabs for delivery recipients and
password changes.

A personal address belongs to the account holder. A delivery recipient is a saved
person and address for receiving orders. For example, a customer can keep their
home as their personal address and save a family member as a delivery recipient.
Changing one does not change the other.

The Profile tab is the default view at `/account`; `/account?tab=recipients`
opens delivery recipients. The Figma canvas remains unchanged.

## What the customer can change

| Information        | Behavior                                                    |
| ------------------ | ----------------------------------------------------------- |
| Username and email | Displayed for reference; cannot be edited here              |
| Full name          | Required; up to 100 characters                              |
| Phone number       | Required; uses the shared international phone control       |
| Address country    | Required; chosen independently from the phone country       |
| Address line 1     | Required; up to 150 characters                              |
| City               | Required; up to 100 characters                              |
| Address line 2     | Optional; up to 150 characters                              |
| Province / region  | Optional; up to 100 characters                              |
| Postal code        | Optional; up to 20 characters                               |
| Profile photo      | Uploaded, cropped, or removed using separate photo controls |

The backend checks the phone number's international format and requires it to be
unique across accounts. Saving a number does not verify that the customer owns
it. Username, email, and password changes are outside this form.

The form stacks fields on narrow screens and places related fields side by side
when space allows. Controls use the application's shared theme in light and dark
appearances.

## Saving personal details

1. Opening the Profile tab loads the customer's saved details. An account without
   a personal address starts with empty address fields.
2. The customer edits the fields and selects **Save changes**. The frontend sends
   the complete editable profile, including the personal address.
3. The backend checks the values and saves the personal details and address
   together. Either both are saved or neither is saved. It creates the personal
   address if one does not exist yet.
4. The frontend displays the returned saved values and a confirmation message.
   It also updates the name and address country held in the shared account state.

The address country is used by country-dependent product pricing, cart data, and
new checkout reviews. Changing it can cause those views to reload their data.
Previously saved purchases and delivery recipients keep their existing details.
A previously issued checkout preview retains its signed values.

**Cancel** restores the last loaded or confirmed saved values. Moving to another
account tab discards unsaved personal-detail edits; returning loads the profile
again. Saving a photo does not discard those edits.

## When loading or saving fails

A failed initial load shows **Try again**. Invalid fields display their errors
beside the relevant inputs, and the customer's unsaved entries remain available
for correction. During a save, the personal-details controls are disabled and a
second save request is blocked.

Sometimes a request reaches the backend but the response is lost. The frontend
cannot tell from that failure alone whether the save happened. It therefore tries
to load the current profile and asks the customer to review it before saving
again. If that reload also fails, it keeps the draft and explains that the result
could not be confirmed. It does not automatically repeat the save.

## Choosing and saving a photo

Photo changes have their own controls and save action. **Save photo** does not
save personal-detail edits, and **Save changes** does not save an unfinished crop.

1. The customer chooses **Upload photo** or **Change photo** and selects a static
   JPEG, PNG, or WebP file. The upload limit is 5 MiB (5 × 1024 × 1024 bytes),
   displayed as 5 MB in the interface.
2. A dialog opens with a square crop. The customer can drag the image or focus the
   crop area and use arrow keys, then adjust the zoom. A circular preview shows
   how the account photo will appear. Rotation is not offered.
3. **Save photo** sends the image and crop to the backend. **Cancel** closes the
   editor without saving the photo.
4. After saving, **Adjust crop** can reuse the retained image without uploading
   the file again. **Remove photo** asks for confirmation before removing it.

The frontend checks the file type and size for early feedback. The backend checks
what the file actually contains, rejects animated or unreadable images, and
rejects images larger than 25 megapixels.

The backend corrects image orientation, removes metadata, and saves WebP images at
quality 85. It retains the full image composition at up to 2048 × 2048 pixels for
later cropping, and creates a separate 512 × 512 avatar. The retained image is an
optimized source rather than an exact copy of the uploaded file. Photo files use
the backend's configured local or Azure storage; replacement and removal follow
the backend's file-cleanup lifecycle.

When re-cropping, the frontend includes the source ID loaded when the editor
opened. This identifies the image being edited. If another action replaced that
image, the backend rejects the old source rather than applying its crop to the
replacement. Older photos without a retained source can use their existing image;
the backend retains an optimized source on the first successful re-crop.

`react-easy-crop` supplies drag/touch and keyboard crop interactions; the existing
Dialog and new shadcn Slider supply themed controls. Dialogs scroll within short
viewports. The Figma node registry records this implementation without a canvas
change or verified mapping.

## Photo errors and the account menu

Failed photo loads offer **Reload photo**. While a photo save or removal is in
progress, duplicate changes and dialog dismissal are blocked.

After an uncertain save or removal, the frontend closes the dialog and reloads
the saved photo for review. A stale source also triggers a reload. If reloading
fails, photo actions wait until a successful reload. Personal-detail drafts stay
in place. An unreadable avatar uses a placeholder icon in the Profile tab.

The account menu in the shared header reads `AuthContext.user.profile_image`.
**AuthContext** is the shared React state containing the signed-in account.
Login and session refresh provide the photo URL. Confirmed photo loads, saves,
removals, and recovery reloads update that URL for the same account. The header
does not fetch the photo separately.

If the header photo is absent or cannot load, it uses the bundled `avatarImage`.
A failed recovery read keeps the last confirmed shared URL until a successful
read supplies a new value.

## Requests and code locations

All requests below act on the signed-in account. The backend derives that account
from the access token; the frontend does not send an account ID to select whose
profile to edit. Successful requests return the saved profile or photo with
HTTP 200. Invalid input returns field errors with HTTP 400; missing or invalid
authentication returns HTTP 401.

| Request                              | Purpose                                    | Sent by the frontend                                           |
| ------------------------------------ | ------------------------------------------ | -------------------------------------------------------------- |
| `GET /api/account/profile/`          | Load personal details                      | No request body                                                |
| `PUT /api/account/profile/`          | Save personal details and address          | `full_name`, `phone_number`, and the complete nested `address` |
| `GET /api/account/profile/photo/`    | Load photo URLs, source ID, and saved crop | No request body                                                |
| `PUT /api/account/profile/photo/`    | Upload a new photo                         | Multipart `image` and JSON-encoded `crop`                      |
| `PUT /api/account/profile/photo/`    | Re-crop the saved source                   | JSON `crop` and `source_id`                                    |
| `DELETE /api/account/profile/photo/` | Remove the avatar and retained source      | No request body                                                |

Crop values are `x`, `y`, `width`, and `height`, expressed as fractions of the
oriented source image. The backend applies the crop; the browser editor supplies
its coordinates.

| File                                                                        | Responsibility                                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [UserAccountPage](../../src/account/pages/UserAccountPage.tsx)              | Select the active account tab and isolate account-specific content                    |
| [ProfilePanel](../../src/account/components/ProfilePanel.tsx)               | Compose the profile screen and personal-details form                                  |
| [useProfile](../../src/account/hooks/useProfile.ts)                         | Load, save, restore, and reconcile personal details                                   |
| [ProfilePhotoManager](../../src/account/components/ProfilePhotoManager.tsx) | Compose photo actions, crop editor, and removal confirmation                          |
| [useProfilePhoto](../../src/account/hooks/useProfilePhoto.ts)               | Load and change photos, recover uncertain outcomes, and synchronize the account photo |
| [Account API functions](../../src/account/api.ts)                           | Send profile, photo, and recipient requests                                           |
| [Account types](../../src/account/types.ts)                                 | Describe the expected profile, address, and photo data                                |
| [Profile error helper](../../src/account/utils/profileError.ts)             | Translate save errors into field messages and identify uncertain outcomes             |

See the backend contracts for [personal details](../../../backend/docs/api/account/profile.md)
and [photos](../../../backend/docs/api/account/profile-photo.md) for exact request
and response definitions. The central [diagram index](../../../docs/diagrams/README.md)
is the starting point for shared business-process documentation.
