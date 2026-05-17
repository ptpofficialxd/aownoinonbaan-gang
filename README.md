# aownoinonbaan

Private cloud space for the gang. This Next.js app uses:

- Neon Postgres for private team accounts and media metadata
- Google Drive as the actual file storage layer
- Cookie-based auth with no public sign-up flow
- A modern dashboard for uploads, categories, recent activity, and media browsing

## Setup

1. Install dependencies with `bun install`
2. Copy `.env.example` to `.env` and fill every required value
3. Run `bun run db:setup`
4. Create your first user with `bun run user:add`
5. Start the app with `bun run dev`

## Google Drive setup

1. Create a Google Cloud service account
2. Enable the Google Drive API
3. Create an OAuth client credential for a web application
4. Add your callback URL to the OAuth client
5. Put `client_id` into `GOOGLE_OAUTH_CLIENT_ID`
6. Put `client_secret` into `GOOGLE_OAUTH_CLIENT_SECRET`
7. Put the callback URL into `GOOGLE_OAUTH_REDIRECT_URI`
8. Put your target folder id into `GOOGLE_DRIVE_ROOT_FOLDER_ID`
9. Start the app, log in as an admin, then connect Google Drive once from the dashboard

The app uploads files into that folder and stores metadata in Neon. Files stay private to your app because media is streamed through authenticated route handlers. The owner only needs to authorize Google Drive once; everyone else keeps using only the web app.

## Notes

- This app is designed for self-hosting or Node-based deployments
- Very large uploads pass through the Next.js server first, so deployment limits still matter
- No public registration is included by design
