# UniPulse — Backend

Anonymous, UBC-only social platform. Students verify a `@student.ubc.ca` email,
optionally upload their class schedule to unlock course-specific communities, and
participate in three tabs per community: **Posts** (Reddit-style), **Group Chat**
(anonymous, realtime), and **Events**.

Auth is **password-based after a one-time email verification**: a student proves
they own a `@student.ubc.ca` inbox (via an emailed code) and sets a password at
signup; afterwards they log in with email **or** username + password. There is
**no private messaging / friend requests** — users are anonymous to each other
and identified only by a changeable alias.

---

## Tech stack

- **Express 5** — REST API
- **MongoDB + Mongoose** — data layer
- **Socket.io** — realtime group chat
- **JWT** — stateless auth (issued after verification / on login)
- **bcryptjs** — password hashing
- **Nodemailer** — emails the OTP verification / reset codes
- **Multer** — handles the schedule file upload (in memory)

---

## Getting started

```bash
cd backend
npm install
cp .env.example .env      # then fill in real values (Mongo, SMTP, secrets)
npm run seed              # (optional) create default general communities
npm run dev               # start with auto-reload (nodemon)
# or
npm start

# Grant a user moderator powers (no public API for this on purpose):
npm run make-moderator -- someone@student.ubc.ca
npm run make-moderator -- someone@student.ubc.ca --revoke
```

Server runs on `http://localhost:5000` by default. Health check: `GET /api/health`.

> **SMTP note:** for Gmail, create an *App Password* and put it in `SMTP_PASS`.

---

## Project structure

```
backend/
  server.js              # entry: express + socket.io + db
  config/db.js           # mongoose connection
  models/                # User, Community, Post, Comment, Message, MessageReply,
                         #   Event, Otp, Reported, ModeratorRequest, reactionSchema
  middleware/
    auth.js              # protect (JWT) + requireNotBanned
    upload.js            # multer schedule upload
    errorHandler.js      # 404 + centralized error JSON
  controllers/           # one per resource
  routes/                # one per resource + index.js (mounts at /api)
  socket/chatSocket.js   # realtime group chat
  utils/                 # token, otp, sendEmail, scheduleParser, likeDislike, emojiReaction, membership...
  scripts/seed.js        # seed default general communities
```

---

## Core flows

### 1. Sign up (email verification + password)
1. `POST /api/auth/signup { email, username, password }` — validates the UBC
   email, alias and password, hashes the password, and emails a 6-digit code.
   **No user row is created yet** (the pending username + password hash live on
   the OTP doc until verification).
2. `POST /api/auth/verify { email, code }` — on success the `User` is created
   with the stashed credentials and a JWT is returned.

### 2. Log in (returning user)
`POST /api/auth/login { identifier, password }` — `identifier` is the email
**or** the username. Returns a JWT.

### 3. Forgot / reset password
1. `POST /api/auth/forgot-password { email }` — emails a reset code (always
   returns success to avoid revealing whether the email is registered).
2. `POST /api/auth/reset-password { email, code, newPassword }` — sets the new
   password.

`POST /api/auth/resend { email }` re-sends whatever code is currently pending.

### 4. Upload schedule (unlocks course communities)
`POST /api/users/me/schedule` (multipart, field `schedule`) — parses the UBC
`.ics` export, stores `enrolledSections`, and auto-creates a `course` community
per section. **Skipping this is allowed** — the user just keeps access to general
communities only.

### 5. Communities & access control
- `general` communities: visible to every verified student.
- `course` communities: visible only to students whose `enrolledSections`
  include that community id. Enforced everywhere via `utils/membership.js`.

### 6. Username changes
`PATCH /api/users/me/username { username }` — allowed **once every 7 days**.

### 7. Moderation
Any user can **report** content — posts, comments, replies, or group-chat
messages — via `POST /api/reports`. Users flagged with
`moderator: true` unlock the **moderator tab** (`/api/moderator/*`), which:
- bypasses community access checks so a mod can browse **every** community
  (general + course), its posts, chat and comment threads — with all ids visible;
- looks up **any user by id or username** and lists everything they've posted;
- **deletes any post / comment / reply / chat message** by id (cascades + resolves reports);
- reviews the **reports queue** and either **deletes** the content or **dismisses**
  ("skips") the report;
- reviews the **user requests queue** (free-text messages users send via
  `POST /api/requests`) and marks them reviewed/dismissed;
- **creates communities and events** (these actions are moderator-only);
- **bans / unbans** a user by id.

All of this is gated by `protect` + `requireModerator`. There is no public
endpoint to become a moderator — use `npm run make-moderator`.

---

## API reference (all under `/api`, JWT required unless noted)

### Auth (public)
| Method | Path                     | Body                              |
|--------|--------------------------|-----------------------------------|
| POST   | `/auth/signup`           | `{ email, username, password }`   |
| POST   | `/auth/verify`           | `{ email, code }`                 |
| POST   | `/auth/login`            | `{ identifier, password }`        |
| POST   | `/auth/forgot-password`  | `{ email }`                       |
| POST   | `/auth/reset-password`   | `{ email, code, newPassword }`    |
| POST   | `/auth/resend`           | `{ email }`                       |

### Users
| Method | Path                  | Notes                              |
|--------|-----------------------|------------------------------------|
| GET    | `/users/me`           | current profile                    |
| POST   | `/users/me/schedule`  | multipart field `schedule`         |
| PATCH  | `/users/me/username`  | `{ username }`, weekly cooldown    |

### Communities
| Method | Path                              | Notes                          |
|--------|-----------------------------------|--------------------------------|
| GET    | `/communities`                    | rooms this user can see        |
| POST   | `/communities`                    | create a general community     |
| GET    | `/communities/:id`                | one community (access-gated)   |

### Posts (Reddit-style)
| Method | Path                                   | Body / Notes                          |
|--------|----------------------------------------|---------------------------------------|
| GET    | `/communities/:communityId/posts`      | `?sort=new\|top&page&limit`           |
| POST   | `/communities/:communityId/posts`      | `{ title, content, tag?, media? }`    |
| GET    | `/posts/:id`                           |                                       |
| POST   | `/posts/:id/react`                     | `{ action: "like"\|"dislike"\|"none" }` |
| POST   | `/posts/:id/emoji`                     | `{ emoji }` — toggle an emoji reaction |
| DELETE | `/posts/:id`                           | author only                           |

### Comments (threaded)
| Method | Path                            | Body / Notes                          |
|--------|---------------------------------|---------------------------------------|
| GET    | `/posts/:postId/comments`       | returns a nested tree                 |
| POST   | `/posts/:postId/comments`       | `{ content, parentId? }`              |
| POST   | `/comments/:id/react`           | `{ action: "like"\|"dislike"\|"none" }` |
| POST   | `/comments/:id/emoji`           | `{ emoji }` (also covers replies)     |
| DELETE | `/comments/:id`                 | author only (cascades to replies)     |

### Events
| Method | Path                                | Body / Notes                       |
|--------|-------------------------------------|------------------------------------|
| GET    | `/communities/:communityId/events`  | `?past=true` to include past       |
| POST   | `/communities/:communityId/events`  | **moderator only** — `{ title, description?, eventDate }`|
| GET    | `/events/:id`                       |                                    |
| DELETE | `/events/:id`                       | creator only                       |

### Communities
| Method | Path                | Body / Notes                                   |
|--------|---------------------|------------------------------------------------|
| GET    | `/communities`      | rooms this user can see                        |
| POST   | `/communities`      | **moderator only** — `{ name, description?, allowedTags? }` |
| GET    | `/communities/:id`  | one community (access-gated)                    |

Course communities are created automatically by `POST /users/me/schedule` from
the uploaded calendar (any missing section room is provisioned on the fly).

### Chat history (live sending is via Socket.io)
| Method | Path                                  | Notes                          |
|--------|---------------------------------------|--------------------------------|
| GET    | `/communities/:communityId/messages`  | `?before=<ISO>&limit` cursor   |

### Chat reactions & replies (REST; also available live over Socket.io)
| Method | Path                                | Body / Notes                              |
|--------|-------------------------------------|-------------------------------------------|
| POST   | `/messages/:id/react`               | `{ action: "like"\|"dislike"\|"none" }`   |
| POST   | `/messages/:id/emoji`               | `{ emoji }` — toggles an emoji reaction   |
| GET    | `/messages/:messageId/replies`      | nested reply thread for a message         |
| POST   | `/messages/:parentId/replies`       | `{ content }` — parentId may be a message **or** a reply |
| POST   | `/message-replies/:id/react`        | `{ action: "like"\|"dislike"\|"none" }`   |
| POST   | `/message-replies/:id/emoji`        | `{ emoji }`                               |
| DELETE | `/message-replies/:id`              | author only (cascades to nested replies)  |

### Reports (any user)
| Method | Path        | Body                                    |
|--------|-------------|-----------------------------------------|
| POST   | `/reports`  | `{ contentType, contentId, reason? }`   |

`contentType` is `"post"`, `"comment"`, `"reply"` or `"message"` (group-chat
message). A user can only report a given piece of content once.

### Requests to moderators (any user)
| Method | Path        | Body                          |
|--------|-------------|-------------------------------|
| POST   | `/requests` | `{ message, communityId? }`   |

A free-text message asking moderators to create/update a community. Moderators
read these under `/moderator/requests`.

### Moderator tab (requires `moderator: true`)
| Method | Path                                            | Notes                               |
|--------|-------------------------------------------------|-------------------------------------|
| GET    | `/moderator/communities`                        | `?search=` all rooms (general+course)|
| GET    | `/moderator/communities/:communityId/posts`     | any room's posts (no gate)          |
| GET    | `/moderator/communities/:communityId/messages`  | any room's chat (with senderIds)    |
| GET    | `/moderator/posts/:postId/comments`             | any post's full thread              |
| GET    | `/moderator/users/:identifier`                  | by id OR username + their content   |
| PATCH  | `/moderator/users/:id/ban`                      | `{ banned: true\|false }`           |
| DELETE | `/moderator/posts/:id`                          | delete any post (cascades)          |
| DELETE | `/moderator/comments/:id`                       | delete any comment/reply (cascades) |
| DELETE | `/moderator/messages/:id`                       | delete any group-chat message       |
| GET    | `/moderator/reports`                            | `?status=pending\|resolved\|dismissed\|all` |
| POST   | `/moderator/reports/:id/resolve`                | `{ action: "delete"\|"dismiss" }`   |
| GET    | `/moderator/requests`                           | user requests; `?status=pending\|reviewed\|dismissed\|all` |
| POST   | `/moderator/requests/:id/resolve`               | `{ action: "reviewed"\|"dismissed" }` |

---

## Realtime chat (Socket.io)

Connect with the JWT in the handshake auth, then join a room and exchange messages:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', { auth: { token } });

socket.emit('chat:join', { communityId: 'CPSC-110-101' });
socket.on('chat:message', (msg) => console.log(msg));

socket.emit('chat:message', { communityId: 'CPSC-110-101', content: 'hi!' });

// Reply to a message (or another reply — parentId may be either):
socket.emit('chat:reply', { parentId: '<messageOrReplyId>', content: 'nice!' });
socket.on('chat:reply', (reply) => console.log(reply));

// Like/dislike or emoji-react, live:
socket.emit('chat:react', { targetType: 'message', targetId: '<id>', action: 'like' });
socket.emit('chat:emoji', { targetType: 'reply', targetId: '<id>', emoji: '🔥' });
socket.on('chat:reaction', (state) => console.log(state));
```

**Client → server events:** `chat:join`, `chat:leave`, `chat:typing`,
`chat:message`, `chat:reply`, `chat:react`, `chat:emoji`
**Server → client events:** `chat:joined`, `chat:left`, `chat:message`,
`chat:reply`, `chat:reaction`, `chat:typing`, `chat:error`

Every message, reply and reaction is access-checked and persisted to MongoDB.
Messages and replies carry the sender's anonymous alias and support both
like/dislike and free-form emoji reactions. The same actions are available over
REST (see the tables above) for non-realtime clients.
