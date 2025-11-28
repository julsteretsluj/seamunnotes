# Digital Note Passing (Static Edition)

This is a single-page, entirely static web app that recreates committee note passing for Model UN rooms. Open `index.html` in any modern browser (or host it on any static host like Hostinger, GitHub Pages, Netlify) and you get:

## Features

- ✅ Delegation ➜ Delegation messaging  
- ✅ Delegation ↔ Chair messaging (chair team can reply)  
- ✅ Chairs can ⭐️ star and track important notes  
- ✅ Delegates can target **multiple** delegations/people at once  
- ✅ Each user has day-specific credentials (Day 1 vs Day 2)  
- ✅ Notes display the sender delegation with a flag emoji  
- ✅ Every note requires a topic label (bloc forming, speech POIs/POCs, questions, informal conversations)  
- ✅ Works 100% offline — all data is stored in `localStorage`

## Quick Start

1. **Download or clone** this folder.
2. **Open `index.html`** in Chrome, Edge, or Firefox. Done!
3. Use the credentials in the app (or update them in `app.js`) to log in.

### Hosting on Hostinger (or any static host)

1. Upload these three files to your `public_html` directory:
   - `index.html`
   - `styles.css`
   - `app.js`
2. Make sure `index.html` sits at the root of `public_html`.
3. Done — no backend, no build step required.

## Customising logins

User accounts are defined near the top of `app.js` (`DEFAULT_USERS`). Each user has:

```js
{
  id: 'usa-1',
  name: 'United States Delegate',
  role: 'delegate',
  delegation: 'United States',
  flag: '🇺🇸',
  credentials: { 1: 'usa-day1', 2: 'usa-day2' }
}
```

- Update the `credentials` values the night before each day to issue fresh passwords.
- Use `PASSWORDS.md` as the offline ledger for the dais. Print or encrypt it; distribute individual slips manually (the UI no longer exposes passwords).

## Data persistence

- Notes, stars, read-status, and any edited user data live in `localStorage`.  
- Click **“Reset demo data”** on the login screen to wipe everything and restore defaults.
- Click **“Export notes”** (after logging in) to download a CSV log of every note sent.

## Extending the app

Want extra users, topics, or UI changes?

1. Edit `DEFAULT_USERS` or `TOPICS` in `app.js`.
2. Save.
3. Refresh the browser (click “Reset demo data” if you want the new defaults immediately).

## Limits

Because it’s fully static:

- There is no cross-device sync. Every browser has its own local copy of the notes.
- If you need a centralised, multi-room deployment with real-time syncing, deploy the backend (Express/SQLite) to Render (recommended) or another Node host. See `RENDER_DEPLOYMENT.md` or `DEPLOYMENT.md` for the steps, then point the frontend’s `REACT_APP_API_URL` / `REACT_APP_WS_URL` at that backend before building.

## Browser support

Tested on the latest Chrome, Edge, and Firefox. Safari works but `export` may require user interaction.

---

Questions? Improvements? Pop open `app.js` — it’s plain vanilla JavaScript with plenty of comments and easy to tweak mid-conference. Good luck with your committee! 🎤📝

# seamundigitalnotepassing
