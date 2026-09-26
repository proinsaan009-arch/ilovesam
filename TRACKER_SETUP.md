# Connect the shared cycle tracker

The tracker files are ready, but shared saving starts only after the site is deployed through Cloudflare Pages and connected to D1. A local file preview and GitHub Pages alone cannot run the backend.

## 1. Put the website files in the GitHub repository

Place the contents of this folder at the top level of the repository so it contains:

- index.html, tracker.html, style.css, tracker.css, script.js, tracker.js
- _headers
- images/ (when you add photos)
- functions/
- schema.sql

If you keep the files inside a folder named outputs, set that as the Cloudflare Pages root directory instead.

## 2. Connect the repository to Cloudflare Pages

1. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git**.
2. Authorize GitHub and choose this repository.
3. Leave **Build command** blank.
4. Set **Build output directory** to a single dot (.) when the files are at the repository root.
5. Deploy the project.

Cloudflare Pages Git integration deploys future pushes automatically. The functions folder must be at the Pages project root. See the [Cloudflare Git integration guide](https://developers.cloudflare.com/pages/get-started/git-integration/) and [Pages Functions setup](https://developers.cloudflare.com/pages/functions/get-started/).

## 3. Create the database

1. In Cloudflare, open **Storage & databases → D1 SQL database → Create database**.
2. Name it sam-cycle-notes.
3. Open the new database’s SQL console.
4. Run each CREATE TABLE statement from schema.sql in the SQL console.

## 4. Bind the database to the site

1. Open **Workers & Pages → your Pages project → Settings → Bindings**.
2. Choose **Add → D1 database binding**.
3. Set **Variable name** to DB.
4. Select sam-cycle-notes and save.
5. Bind it to **Production**. Leave Preview unbound unless you create a separate test database for Preview.
6. Redeploy so the binding takes effect.

## 5. Add the two encrypted secrets

In the Pages project, open **Settings → Variables and Secrets → Add**. Create both as encrypted secrets for Production:

- TRACKER_SETUP_PHRASE — create the secret phrase that will be your initial shared passcode (at least 20 characters).
- TRACKER_SESSION_SECRET — create a random secret at least 32 characters long.

Use a password manager to generate and store them. Keep the two values different. Do not put them in GitHub, in the website files, or in a message. Save, then redeploy. Cloudflare’s [Bindings guide](https://developers.cloudflare.com/pages/functions/bindings/) documents database bindings and encrypted secrets.

## 6. Set your shared passphrase

1. Open the deployed site’s tracker.html page over its https pages.dev address.
2. On first visit, enter the TRACKER_SETUP_PHRASE you configured in Cloudflare. This phrase becomes the initial shared passcode.
3. Sam can then open that same tracker page and unlock it with the same secret phrase.

After unlocking, use **Cycle settings → Change shared passphrase** to change it later. Keep the setup phrase private. It is used for first-time setup and serves as the initial shared passcode; after changing the passcode, the old setup phrase no longer unlocks the tracker.

## What the tracker saves

Period start/end dates, daily flow (spotting, light, medium, heavy, or no bleeding), mood and optional notes, and cycle settings are saved in D1. The login uses a signed, secure browser cookie; the passphrase itself is stored as a salted hash. The public website can still be viewed by anyone, but tracker records require the shared passphrase.

Phase and next-period displays are calendar estimates from the dates entered. They do not confirm ovulation or predict fertility.
