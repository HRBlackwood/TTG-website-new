# Vercel + Convex Deployment

## 1) Install and log in

```bash
npm install
npx convex login
```

## 2) Initialize Convex deployment

```bash
npx convex dev
```

This creates the generated Convex files and links your project.

## 3) Set Convex environment variables

In Convex dashboard (for your deployment), add:

- `ADMIN_PASSWORD` = your admin password used for `admin.html` login

## 4) Set frontend API URL

Edit `config.js` and set:

```js
window.TTG_CONVEX_URL = "https://YOUR-CONVEX-DEPLOYMENT.convex.site";
```

## 5) Deploy Convex functions

```bash
npm run deploy:convex
```

## 6) Deploy site to Vercel

- Push this repository to GitHub.
- Import project in Vercel as a static site.
- No build command is required.

## Notes

- Membership submissions now persist in Convex.
- Admin member management, website editor, and upcoming event posting all use Convex.
- Legacy browser data can be imported once using **Migrate Local Data** in the admin header.
