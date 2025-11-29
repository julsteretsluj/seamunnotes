# Render Deployment Guide (Backend + Frontend)

These steps turn the note-passing system into a shared, multi-device experience hosted entirely on Render.

---

## 0. Prerequisites

* Render account (free tier works) – <https://render.com>
* GitHub repo (or Render’s “Public Git repo” URL) containing:
  * `backend/` – Express/SQLite API
  * `frontend/` – React SPA (if you want Render to build & host the static frontend; otherwise you can continue using Hostinger)
* Node.js 18+ locally for testing.

---

## 1. Deploy the backend API (Web Service)

1. Push / ensure the backend folder is committed.
2. Log in to Render and click **New +** ➜ **Web Service**.
3. Connect the repository and choose your branch.
4. In the “Root Directory” field enter `backend`.
5. Use the following settings:

   | Setting | Value |
   | --- | --- |
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `node index.js` |
   | Instance Type | Free (or higher for always-on) |

6. Add Environment Variables:

   | Key | Value |
   | --- | --- |
   | `JWT_SECRET` | Generate (`openssl rand -base64 32`) |
   | `ALLOWED_ORIGINS` | e.g. `https://seamunnotepassing.com,https://www.seamunnotepassing.com` |
   | `DATABASE_PATH` (optional) | `/tmp/database.sqlite` or default |

7. Click **Create Web Service**. Render installs packages and runs your API.
8. Note the service URL, e.g. `https://note-backend.onrender.com`.

### Verify backend

```bash
curl https://note-backend.onrender.com/api/health
```

You should get `{ "ok": true, ... }`.

---

## 2. (Option A) Host the React frontend on Render Static Site

1. Click **New +** ➜ **Static Site**.
2. Same repo/branch, root directory `frontend`.
3. Build Command: `npm install && npm run build`
4. Publish Directory: `build`
5. Add environment variables:

   | Key | Value |
   | --- | --- |
   | `REACT_APP_API_URL` | `https://note-backend.onrender.com/api` |
   | `REACT_APP_WS_URL` | `wss://note-backend.onrender.com/ws` |

6. Deploy. Render will output a static site URL like `https://note-frontend.onrender.com`.
7. Point your custom domain (optional) in Render’s dashboard.

### Option B — keep hosting the static files elsewhere

1. Locally run:
   ```bash
   cd frontend
   echo "REACT_APP_API_URL=https://note-backend.onrender.com/api" > .env.production
   echo "REACT_APP_WS_URL=wss://note-backend.onrender.com/ws" >> .env.production
   npm install
   npm run build
   ```
2. Upload the contents of `frontend/build` to Hostinger (or your static host).

---

## 3. Test end-to-end

1. Visit the frontend (Render static URL or Hostinger domain).
2. Log in using one of the seeded credentials (e.g., `EP Chair 1` etc. depending on your DB).
3. Open the site on another device and log in with a different account from the same committee.
4. Send a note—it should appear on the other device instantly via WebSockets.

Check the browser console/network tab for CORS/WebSocket errors. If needed, update `ALLOWED_ORIGINS` in Render and redeploy.

---

## 4. Maintenance tips

* **Auto deploy**: Toggle it on in Render so pushes to your branch redeploy automatically.
* **Database**: The default SQLite file is stored inside the container; for persistent storage across redeploys use Render’s “Persistent Disk” (Starter plan+) and set `DATABASE_PATH=/var/data/database.sqlite`.
* **Scaling**: Free tier spins down after 15 minutes. Upgrade to Starter if you need always-on.
* **Logs**: Use Render’s “Logs” tab to monitor real-time errors during the conference.
* **Credential rotation**: Update the backend users table (via script or admin endpoint) nightly, then notify delegates.

That’s it—Render now hosts the backend (and optionally frontend), enabling cross-device note passing with the same codebase you’ve been developing locally.***

