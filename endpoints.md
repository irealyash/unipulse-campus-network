# UniPulse API Endpoints

All endpoints are mounted under `/api`. Unless noted otherwise, every endpoint (except Auth) requires a valid JWT in the `Authorization: Bearer <token>` header.

---

## Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check — returns `{ success, status, time }` |

---

## Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register with email, username, password; sends OTP |
| POST | /api/auth/verify | Verify email OTP, create account, return JWT |
| POST | /api/auth/login | Login with email/username + password, return JWT |
| POST | /api/auth/forgot-password | Send password-reset OTP to email |
| POST | /api/auth/reset-password | Verify reset OTP and set new password |
| POST | /api/auth/resend | Resend the pending OTP code |

---

## Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users/me | Get current user's profile |
| POST | /api/users/me/joined-communities | Join a public catalog community |
| DELETE | /api/users/me/joined-communities/:communityId | Leave a catalog community |
| POST | /api/users/me/community-onboarding | Mark community onboarding complete |
| POST | /api/users/me/schedule | Upload .xlsx schedule file (multipart) |
| PATCH | /api/users/me/username | Change display username (7-day cooldown) |

---

## Communities

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/communities | List user's navbar communities |
| GET | /api/communities/catalog | Browse public catalog by category |
| GET | /api/communities/:id | Get a single community (access-gated) |
| GET | /api/communities/:communityId/posts | List posts in a community (paginated) |
| POST | /api/communities/:communityId/posts | Create a post (pending approval) |
| GET | /api/communities/:communityId/events | List events in a community |
| POST | /api/communities/:communityId/events | Create an event (pending approval) |
| GET | /api/communities/:communityId/timeline | Merged chat timeline (messages + replies) |
| GET | /api/communities/:communityId/messages | Chat message history (paginated) |

---

## Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/posts/:id | Get a single post |
| DELETE | /api/posts/:id | Delete own post (cascades comments) |
| POST | /api/posts/:id/react | Like/dislike/clear reaction on a post |
| POST | /api/posts/:id/emoji | Toggle emoji reaction on a post |
| GET | /api/posts/:postId/comments | Get threaded comment tree for a post |
| POST | /api/posts/:postId/comments | Add a comment or reply to a post |

---

## Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/comments/:id/react | Like/dislike/clear reaction on a comment |
| POST | /api/comments/:id/emoji | Toggle emoji reaction on a comment |
| DELETE | /api/comments/:id | Delete own comment (cascades replies) |

---

## Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/messages/:id/react | Like/dislike/clear reaction on a message |
| POST | /api/messages/:id/emoji | Toggle emoji reaction on a message |
| GET | /api/messages/:messageId/replies | Get nested reply thread for a message |
| POST | /api/messages/:parentId/replies | Reply to a message or another reply |

---

## Message Replies

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/message-replies/:id/react | Like/dislike/clear reaction on a reply |
| POST | /api/message-replies/:id/emoji | Toggle emoji reaction on a reply |
| DELETE | /api/message-replies/:id | Delete own reply (cascades nested replies) |

---

## Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/events/public | List all public upcoming events |
| GET | /api/events/:id | Get a single event |
| DELETE | /api/events/:id | Delete own event |
| POST | /api/events/:id/rsvp | RSVP to an event (coming/busy/none) |

---

## Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/reports | File a report against content |

---

## Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/requests | Submit a message/request to moderators |

---

## Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/uploads/media | Upload a media file (image/video) to Cloudinary |

---

## Mod Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/mod-messages/my-conversation | Get current user's moderator conversation |
| GET | /api/mod-messages/conversations | List all moderator conversations (mod only) |
| GET | /api/mod-messages/lookup-user | Search user by username/id (mod only) |
| POST | /api/mod-messages/start | Start a conversation with a user (mod only) |
| GET | /api/mod-messages/conversations/:conversationId/messages | List messages in a conversation |
| POST | /api/mod-messages/conversations/:conversationId/messages | Send a message in a conversation |

---

## Moderator (all require moderator role)

### Post Approval Queue

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/moderator/posts | List posts for review (filterable by status) |
| POST | /api/moderator/posts/:id/approve | Approve a pending post |
| POST | /api/moderator/posts/:id/reject | Reject a pending post |

### Event Approval Queue

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/moderator/events | List events for review (filterable by status) |
| POST | /api/moderator/events/:id/approve | Approve a pending event (assigns tag) |
| POST | /api/moderator/events/:id/reject | Reject a pending event |

### Community Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/moderator/communities | List/search all communities |
| POST | /api/moderator/communities | Create a new community |
| PATCH | /api/moderator/communities/:communityId | Update community details |
| POST | /api/moderator/communities/:communityId/members | Add a user to a private community |
| DELETE | /api/moderator/communities/all | Delete ALL communities |
| DELETE | /api/moderator/communities/course | Delete all course communities |
| DELETE | /api/moderator/communities/:communityId | Delete a specific community |

### Content Browsing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/moderator/communities/:communityId/posts | Browse any community's posts |
| GET | /api/moderator/communities/:communityId/messages | Browse any community's chat |
| GET | /api/moderator/posts/:postId/comments | Browse any post's comment tree |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/moderator/users/:identifier | Look up user by id or username |
| PATCH | /api/moderator/users/:id/ban | Ban or unban a user |

### Content Deletion

| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | /api/moderator/posts/:id | Delete any post |
| DELETE | /api/moderator/comments/:id | Delete any comment/reply |
| DELETE | /api/moderator/messages/:id | Delete any chat message |
| DELETE | /api/moderator/events/:id | Delete any event |

### Reports Queue

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/moderator/reports | List reports (filterable by status) |
| POST | /api/moderator/reports/:id/resolve | Resolve a report (delete or dismiss) |

### User Requests Queue

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/moderator/requests | List user requests (filterable by status) |
| POST | /api/moderator/requests/:id/resolve | Mark request reviewed or dismissed |
