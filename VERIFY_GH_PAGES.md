# GitHub Pages Verification Checklist

Use this after `firebase-config.js` is filled and GitHub Pages is published.

## Preconditions

- `firebase-config.js` has valid Firebase Web App keys.
- Firestore rules from `firestore.rules` are published.
- Firebase Auth Email/Password is enabled.
- Admin user exists in Authentication.
- Matching admin UID exists in `admins/{uid}` with `active: true`.

## Verification Steps

1. Open `index.html` on your GitHub Pages site.
2. Submit a membership form entry.
3. Open `admin.html`, log in with Firebase admin email/password.
4. Confirm the new membership appears in the member table.
5. In **Events Posting**, create a new event.
6. Open `events.html` and confirm the event appears.
7. Edit the same event and confirm updates appear on `events.html`.
8. Delete the event and confirm it is removed.
9. In **Website Editor**, change content and save.
10. Refresh `index.html` and verify changes appear.
11. Log out and verify admin actions are blocked until log-in.
12. Clear browser cache or open another device and confirm data still exists.

## Expected Result

- Memberships, new events, and current site content persist across refreshes and devices.
