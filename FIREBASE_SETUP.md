# Firebase Setup (GitHub Pages)

## 1) Create project and web app

1. Open Firebase Console.
2. Create a project (or use existing).
3. Add a Web App and copy the Firebase config object.

## 2) Enable products

1. Enable **Firestore Database** (Production mode).
2. Enable **Authentication** with **Email/Password** provider.

## 3) Deploy Firestore security rules

Use the rules in `firestore.rules`.

In Firebase Console:
- Firestore Database -> Rules
- Paste `firestore.rules` content
- Publish

## 4) Create admin auth user

1. Authentication -> Users -> Add user
2. Create admin email/password account

## 5) Create admin allow-list doc

In Firestore, create document:
- Collection: `admins`
- Document ID: `<admin-auth-uid>`
- Fields:
  - `active: true`
  - `email: "<admin email>"`

The UID must match the Authentication user UID.

## 6) Configure frontend

Update `firebase-config.js` with your web app values:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

## 7) Publish website

Push to GitHub and let GitHub Pages publish.

## Notes

- Membership submissions are public create.
- Admin dashboard operations (member management, event posting, site editor writes) require Firebase Auth sign-in and `admins/{uid}.active == true`.
