# UniPulse

An anonymous, campus-focused community platform for university students — join rooms, post, chat in realtime, discover events, upload your schedule, and moderate content safely.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-unipulse.live-0A66C2?style=for-the-badge&logo=googlechrome&logoColor=white)](https://unipulse.live)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)

---

## Live demo

**Try it here → [https://unipulse.live](https://unipulse.live)**

On the login or signup page, click **Demo Login**, then choose a role:

| Role | What you can explore | Credentials |
|------|----------------------|-------------|
| **User** | Communities, posts, chat, events, schedule upload | `demo_user@unipulse.live` / `Password123` |
| **Moderator** | Reports, bans, community management, mod tools | `demo_admin@unipulse.live` / `Password123` |

> Tip: open two browser profiles (or one normal + one private window) to demo user ↔ moderator messaging and realtime chat side by side.

---

## Features

- **UBC-verified auth** — Signup requires a `@student.ubc.ca` email, proven with a one-time code; afterwards login is email/username + password.
- **Anonymous usernames** — Students appear under changeable aliases, not real names.
- **Communities** — General rooms plus course communities unlocked from a schedule upload.
- **Posts & comments** — Reddit-style feeds with reactions, media, and GIF support.
- **Realtime group chat** — Socket.io rooms with live messages and replies.
- **Events** — Create and browse community events across the campus hub.
- **Schedule upload** — Parse a course schedule file to unlock relevant course communities.
- **Reporting & moderation** — Users can report content; moderators review reports, ban users, manage communities, and message students.
- **Demo accounts** — Seeded recruiter logins so anyone can try both roles without signing up.

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 19, Vite, Redux Toolkit, React Router, Tailwind CSS, DaisyUI, Socket.io Client, Axios |
| Backend | Node.js, Express 5, Mongoose, JWT, bcrypt, Multer, Socket.io |
| Data & media | MongoDB Atlas, Cloudinary |
| Email | Resend (OTP + password reset) |
| Deploy | Vercel (frontend) · Railway (API) · custom domain `unipulse.live` |

---

## Project structure

```
UniPulse/
├── frontend/                 # React + Vite SPA
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # UI (auth shell, chat, modals, …)
│   │   ├── features/         # Redux slices (auth, communities, chat, moderator, …)
│   │   ├── pages/            # Route-level screens
│   │   ├── lib/              # API client, socket helpers
│   │   └── App.jsx           # Routing
│   └── vercel.json
└── backend/                  # Express + Socket.io API
    ├── controllers/
    ├── models/
    ├── routes/
    ├── socket/               # Realtime chat
    ├── middleware/
    ├── utils/                # Auth helpers, demo seed, schedule parser, …
    ├── scripts/              # Community seed, make-moderator CLI
    └── server.js
```

---

## Architecture (short)

```
Browser (React / Redux)
    │  REST  ──►  Express API  ──►  MongoDB
    │  WS    ──►  Socket.io    ──►  community chat rooms
    │
    └─ media uploads ──► Cloudinary
    └─ OTP / reset   ──► Resend
```

Auth is JWT-based. Community membership, posts, events, reports, and moderator actions go through REST. Live chat shares the same HTTP server via Socket.io.

---

## Local development

### Prerequisites

- Node.js 20+
- A MongoDB Atlas (or local Mongo) connection string
- Optional for full parity: Cloudinary + Resend credentials

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill MONGO_URI, JWT_SECRET, OTP_SECRET, CLIENT_URL, etc.
npm run dev            # http://localhost:5000
```

Demo accounts are upserted automatically on every server start.

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173 — proxies /api to the backend
```

For production builds, set `VITE_API_URL` to your public API origin.

---

## Demo accounts (local & production)

| Role | Email | Password | Username |
|------|-------|----------|----------|
| User | `demo_user@unipulse.live` | `Password123` | `demo_user` |
| Moderator | `demo_admin@unipulse.live` | `Password123` | `demo_admin` |

These usernames are reserved and cannot be claimed by other signups.

---

## Scripts (backend)

```bash
npm run dev                         # nodemon
npm start                           # production entry
npm run seed                        # seed community catalog
npm run make-moderator -- email@…   # grant / revoke moderator (--revoke)
```

---

## Disclaimer

UniPulse is an independent student / portfolio project. It is **not** affiliated with, endorsed by, or supported by The University of British Columbia. Demo accounts are public for recruiter evaluation — do not store personal or sensitive data in the live demo environment.

---

## Contributing

Issues and pull requests are welcome. Please keep changes focused, never commit `.env` files or real secrets, and smoke-test login + chat + a moderator action before opening a PR.

---

## License

ISC © Yash Sharma
