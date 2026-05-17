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
3. Generate a JSON key for the service account
4. Put the client email into `GOOGLE_SERVICE_ACCOUNT_EMAIL`
5. Put the private key into `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
6. Share your target Drive folder or Shared Drive with the service account email
7. Put that folder id into `GOOGLE_DRIVE_ROOT_FOLDER_ID`

The app uploads files into that folder and stores metadata in Neon. Files stay private to your app because media is streamed through authenticated route handlers.

## Notes

- This app is designed for self-hosting or Node-based deployments
- Very large uploads pass through the Next.js server first, so deployment limits still matter
- No public registration is included by design
