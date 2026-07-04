# UniPulse API — Detailed Endpoint Documentation

All endpoints are served under the base path `/api`. Responses follow the envelope `{ success: boolean, ... }`. Errors return `{ success: false, message: string }`.

---

## Auth Endpoints

### POST /api/auth/signup

Register a new user and send a verification OTP to their email.

- **Auth required:** No
- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | email | string | Yes | Must end in `@student.ubc.ca` (or be a configured moderator email) |
  | username | string | Yes | 3–10 chars: letters, numbers, underscores |
  | password | string | Yes | Minimum 8 characters |
- **Response (200):**
  ```json
  { "success": true, "message": "Verification code sent. Check your UBC inbox to finish signing up." }
  ```
- **Errors:** 400 (invalid email/username/password), 409 (email or username taken)

---

### POST /api/auth/verify

Complete signup by verifying the emailed OTP code. Creates the user account and returns a JWT.

- **Auth required:** No
- **Request body:**
  | Field | Type | Required |
  |-------|------|----------|
  | email | string | Yes |
  | code | string | Yes |
- **Response (201):**
  ```json
  {
    "success": true,
    "message": "Account created.",
    "token": "<JWT>",
    "user": { "id", "email", "username", "enrolledSections", "joinedCommunities", "communityOnboardingComplete", "scheduleUploaded", "isBanned", "moderator", "lastUsernameChange", "createdAt" }
  }
  ```
- **Errors:** 400 (missing fields, wrong code, expired), 429 (too many attempts), 409 (race condition clash)

---

### POST /api/auth/login

Authenticate with email or username plus password.

- **Auth required:** No
- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | identifier | string | Yes | Email or username |
  | password | string | Yes | |
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Logged in.",
    "token": "<JWT>",
    "user": { ...serialized user... }
  }
  ```
- **Errors:** 400 (missing fields), 401 (invalid credentials), 403 (banned)

---

### POST /api/auth/forgot-password

Request a password-reset OTP. Always returns success to prevent email enumeration.

- **Auth required:** No
- **Request body:**
  | Field | Type | Required |
  |-------|------|----------|
  | email | string | Yes |
- **Response (200):**
  ```json
  { "success": true, "message": "If an account exists for that email, a reset code has been sent." }
  ```

---

### POST /api/auth/reset-password

Verify the reset OTP and set a new password.

- **Auth required:** No
- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | email | string | Yes | |
  | code | string | Yes | 6-digit OTP |
  | newPassword | string | Yes | Minimum 8 characters |
- **Response (200):**
  ```json
  { "success": true, "message": "Password has been reset. You can now log in." }
  ```
- **Errors:** 400 (missing fields, wrong code, weak password), 429 (too many attempts), 404 (account gone)

---

### POST /api/auth/resend

Resend the most recent pending OTP (signup or reset).

- **Auth required:** No
- **Request body:**
  | Field | Type | Required |
  |-------|------|----------|
  | email | string | Yes |
- **Response (200):**
  ```json
  { "success": true, "message": "A new code has been sent." }
  ```
- **Errors:** 400 (no pending verification)

---

## User Endpoints

All user endpoints require authentication (`protect` middleware).

### GET /api/users/me

Returns the authenticated user's profile.

- **Auth required:** Yes
- **Response (200):**
  ```json
  {
    "success": true,
    "user": { "id", "email", "username", "enrolledSections", "joinedCommunities", "communityOnboardingComplete", "scheduleUploaded", "isBanned", "moderator", "lastUsernameChange", "createdAt" }
  }
  ```

---

### POST /api/users/me/joined-communities

Join a public catalog community (adds it to the user's navbar).

- **Auth required:** Yes
- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | communityId | string | Yes | Must be a public, non-course community in an allowed category |
- **Response (200):**
  ```json
  { "success": true, "message": "Added <name> to your communities.", "user": {...}, "community": {...} }
  ```
- **Errors:** 400 (missing id, private/course community, invalid category), 404 (not found)

---

### DELETE /api/users/me/joined-communities/:communityId

Remove a catalog community from the user's navbar.

- **Auth required:** Yes
- **Params:** `communityId` — the community's string _id
- **Response (200):**
  ```json
  { "success": true, "message": "Community removed from your navbar.", "user": {...} }
  ```

---

### POST /api/users/me/community-onboarding

Mark the community onboarding step as complete.

- **Auth required:** Yes
- **Request body:** None
- **Response (200):**
  ```json
  { "success": true, "user": {...} }
  ```

---

### POST /api/users/me/schedule

Upload a UBC schedule `.xlsx` file. Parses course sections, creates private course communities, and enrolls the user.

- **Auth required:** Yes
- **Content-Type:** `multipart/form-data`
- **Form field:** `schedule` — a single `.xlsx` file (max 5 MB)
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Schedule processed. You now have access to N course communities.",
    "enrolledSections": ["CPSC-110-L1A", ...],
    "addedSections": ["CPSC-110-L1A", ...],
    "user": {...}
  }
  ```
- **Errors:** 400 (no file), 422 (parse failure, no sections found)

---

### PATCH /api/users/me/username

Change the user's display username. Subject to format rules, uniqueness, and a 7-day cooldown.

- **Auth required:** Yes
- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | username | string | Yes | 3–20 chars: letters, numbers, underscores |
- **Response (200):**
  ```json
  { "success": true, "message": "Username updated.", "user": {...} }
  ```
- **Errors:** 400 (invalid format, same as current), 409 (taken), 429 (cooldown active)

---

## Community Endpoints

All community endpoints require authentication.

### GET /api/communities

List communities for the user's navbar (enrolled courses + joined catalogs).

- **Auth required:** Yes
- **Response (200):**
  ```json
  { "success": true, "count": 5, "communities": [{ "_id", "name", "description", "imageUrl", "type", "category", "private", ... }] }
  ```

---

### GET /api/communities/catalog

Browse the public community catalog.

- **Auth required:** Yes
- **Query params:**
  | Param | Type | Required | Notes |
  |-------|------|----------|-------|
  | category | string | Yes | One of: `international`, `faculty`, `academic`, `residence`, `general` |
  | search | string | No | Case-insensitive filter on name/id |
- **Response (200):**
  ```json
  { "success": true, "count": 12, "communities": [...] }
  ```
- **Errors:** 400 (missing/invalid category)

---

### GET /api/communities/:id

Get a single community. Access-gated: user must be enrolled (course) or community must be public/joined.

- **Auth required:** Yes
- **Params:** `id` — community string _id
- **Response (200):**
  ```json
  { "success": true, "community": { "_id", "name", "description", "imageUrl", "type", "category", "private", ... } }
  ```
- **Errors:** 403 (no access), 404 (not found)

---

### GET /api/communities/:communityId/posts

List posts in a community (paginated, access-gated). Only shows approved posts.

- **Auth required:** Yes
- **Params:** `communityId`
- **Query params:**
  | Param | Type | Default | Notes |
  |-------|------|---------|-------|
  | sort | string | `new` | `new` or `top` |
  | page | number | 1 | |
  | limit | number | 20 | Max 50 |
- **Response (200):**
  ```json
  { "success": true, "page": 1, "limit": 20, "total": 42, "hasMore": true, "posts": [...] }
  ```

---

### POST /api/communities/:communityId/posts

Create a new post (starts as `pending` until moderator approves).

- **Auth required:** Yes
- **Banned check:** Yes (`requireNotBanned`)
- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | title | string | Yes | |
  | content | string | Yes | |
  | tag | string | Yes | One of: `General`, `Discussion`, `Question`, `Life Sucks`, `Humour`, `Angry`, `Confession` |
  | media | array | No | `[{ url: string, mediaType: "image"|"video"|"gif" }]` |
- **Response (201):**
  ```json
  { "success": true, "post": {...}, "message": "Your post has been submitted for moderator approval." }
  ```
- **Errors:** 400 (missing title/content/tag, invalid tag)

---

### GET /api/communities/:communityId/events

List events in a community.

- **Auth required:** Yes
- **Query params:**
  | Param | Type | Default | Notes |
  |-------|------|---------|-------|
  | past | string | `false` | Set `true` to include past events |
  | sort | string | `date` | `date` or `rsvp` |
  | tag | string | — | Filter: `Official` or `Student-Led` |
- **Response (200):**
  ```json
  { "success": true, "count": 3, "events": [{ ..., "comingCount", "busyCount", "myRsvp" }] }
  ```

---

### POST /api/communities/:communityId/events

Create a new event (starts as `pending`).

- **Auth required:** Yes
- **Banned check:** Yes
- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | title | string | Yes | |
  | description | string | No | |
  | eventDate | string (ISO) | Yes | Must be in the future |
  | imageUrl | string | No | Cover image URL |
  | media | array | No | `[{ url, mediaType }]` |
  | capacity | number | No | Min 1; omit or set `unlimitedCapacity: true` for no limit |
  | unlimitedCapacity | boolean | No | Default true |
  | moderatorNote | string | No | Private note for mods |
- **Response (201):**
  ```json
  { "success": true, "event": {...}, "message": "Your event has been submitted for moderator approval." }
  ```

---

### GET /api/communities/:communityId/messages

Load chat message history (cursor-based pagination, newest first).

- **Auth required:** Yes
- **Query params:**
  | Param | Type | Default | Notes |
  |-------|------|---------|-------|
  | before | string (ISO) | — | Fetch messages older than this timestamp |
  | limit | number | 30 | Max 100 |
- **Response (200):**
  ```json
  { "success": true, "count": 30, "messages": [...] }
  ```

---

### GET /api/communities/:communityId/timeline

Merged chronological feed of messages and replies for the chat UI.

- **Auth required:** Yes
- **Query params:**
  | Param | Type | Default | Notes |
  |-------|------|---------|-------|
  | limit | number | 100 | Max 200 (messages); replies fetched at 2x |
- **Response (200):**
  ```json
  { "success": true, "count": 85, "items": [{ ...message/reply fields, "itemType": "message"|"reply", "parentAuthor"?, "parentPreview"? }] }
  ```

---

## Post Endpoints

All require authentication.

### GET /api/posts/:id

Get a single post. Access-gated by community membership. Non-approved posts visible only to author and moderators.

- **Auth required:** Yes
- **Response (200):**
  ```json
  { "success": true, "post": { "_id", "communityId", "authorId", "anonymousUsername", "title", "content", "tag", "media", "likes", "dislikes", "reactions", "score", "myVote", "commentCount", "status", "createdAt" } }
  ```

---

### DELETE /api/posts/:id

Delete the authenticated user's own post. Cascades to all comments and resolves related reports.

- **Auth required:** Yes
- **Response (200):**
  ```json
  { "success": true, "message": "Post deleted." }
  ```
- **Errors:** 403 (not author), 404 (not found)

---

### POST /api/posts/:id/react

Toggle a like/dislike reaction on a post.

- **Auth required:** Yes
- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | action | string | Yes | `"like"`, `"dislike"`, or `"none"` |
- **Response (200):**
  ```json
  { "success": true, "score": 5, "post": {...} }
  ```
- **Notes:** Only works on approved posts.

---

### POST /api/posts/:id/emoji

Toggle an emoji reaction on a post.

- **Auth required:** Yes
- **Request body:**
  | Field | Type | Required |
  |-------|------|----------|
  | emoji | string | Yes |
- **Response (200):**
  ```json
  { "success": true, "state": "added"|"removed", "reactions": [...], "post": {...} }
  ```

---

### GET /api/posts/:postId/comments

Get the full threaded comment tree for a post.

- **Auth required:** Yes
- **Query params:**
  | Param | Type | Default |
  |-------|------|---------|
  | sort | string | `new` (`new` or `top`) |
- **Response (200):**
  ```json
  { "success": true, "count": 15, "comments": [{ ..., "replies": [{ ..., "replies": [...] }] }] }
  ```
- **Notes:** Only available on approved posts.

---

### POST /api/posts/:postId/comments

Add a comment or nested reply.

- **Auth required:** Yes
- **Banned check:** Yes
- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | content | string | Conditional | Required if no media |
  | parentId | string | No | ObjectId of parent comment (for replies) |
  | media | object | No | `{ url: string, mediaType: "image"|"video"|"gif" }` |
- **Response (201):**
  ```json
  { "success": true, "comment": { "_id", "postId", "parentId", "authorId", "anonymousUsername", "content", "media", "likes", "dislikes", "reactions", "score", "myVote", "createdAt" } }
  ```
- **Errors:** 400 (empty content + no media, invalid parent)

---

## Comment Endpoints

All require authentication.

### POST /api/comments/:id/react

Toggle a like/dislike on a comment.

- **Auth required:** Yes
- **Request body:**
  | Field | Type | Required |
  |-------|------|----------|
  | action | string | Yes (`"like"`, `"dislike"`, `"none"`) |
- **Response (200):**
  ```json
  { "success": true, "score": 3, "comment": {...} }
  ```

---

### POST /api/comments/:id/emoji

Toggle an emoji reaction on a comment.

- **Auth required:** Yes
- **Request body:**
  | Field | Type | Required |
  |-------|------|----------|
  | emoji | string | Yes |
- **Response (200):**
  ```json
  { "success": true, "state": "added"|"removed", "reactions": [...], "comment": {...} }
  ```

---

### DELETE /api/comments/:id

Delete the user's own comment and all descendant replies.

- **Auth required:** Yes
- **Response (200):**
  ```json
  { "success": true, "message": "Deleted N comment(s)." }
  ```
- **Errors:** 403 (not author), 404 (not found)

---

## Message Endpoints

All require authentication.

### POST /api/messages/:id/react

Toggle a like/dislike on a chat message.

- **Auth required:** Yes
- **Request body:**
  | Field | Type | Required |
  |-------|------|----------|
  | action | string | Yes (`"like"`, `"dislike"`, `"none"`) |
- **Response (200):**
  ```json
  { "success": true, "score": 2, "message": {...} }
  ```

---

### POST /api/messages/:id/emoji

Toggle an emoji reaction on a chat message.

- **Auth required:** Yes
- **Request body:**
  | Field | Type | Required |
  |-------|------|----------|
  | emoji | string | Yes |
- **Response (200):**
  ```json
  { "success": true, "state": "added"|"removed", "reactions": [...], "message": {...} }
  ```

---

### GET /api/messages/:messageId/replies

Get the nested reply thread for a root message.

- **Auth required:** Yes
- **Response (200):**
  ```json
  { "success": true, "count": 8, "replies": [{ ..., "replies": [...] }] }
  ```

---

### POST /api/messages/:parentId/replies

Create a reply to a message or another reply.

- **Auth required:** Yes
- **Banned check:** Yes
- **Request body:**
  | Field | Type | Required |
  |-------|------|----------|
  | content | string | Yes |
- **Response (201):**
  ```json
  { "success": true, "reply": { "_id", "communityId", "parentMessageId", "parentType", "senderId", "anonymousUsername", "content", "createdAt" } }
  ```
- **Notes:** `parentId` can reference either a Message or a MessageReply (threaded replies).

---

## Message Reply Endpoints

All require authentication.

### POST /api/message-replies/:id/react

Toggle a like/dislike on a reply.

- **Auth required:** Yes
- **Request body:**
  | Field | Type | Required |
  |-------|------|----------|
  | action | string | Yes |
- **Response (200):**
  ```json
  { "success": true, "score": 1, "reply": {...} }
  ```

---

### POST /api/message-replies/:id/emoji

Toggle an emoji reaction on a reply.

- **Auth required:** Yes
- **Request body:**
  | Field | Type | Required |
  |-------|------|----------|
  | emoji | string | Yes |
- **Response (200):**
  ```json
  { "success": true, "state": "added"|"removed", "reactions": [...], "reply": {...} }
  ```

---

### DELETE /api/message-replies/:id

Delete the user's own reply and all nested descendant replies.

- **Auth required:** Yes
- **Response (200):**
  ```json
  { "success": true, "message": "Deleted N repl(y/ies).", "removedIds": [...] }
  ```

---

## Event Endpoints

All require authentication.

### GET /api/events/public

List all upcoming approved events from public communities.

- **Auth required:** Yes
- **Query params:**
  | Param | Type | Default | Notes |
  |-------|------|---------|-------|
  | sort | string | `date` | `date` or `rsvp` |
  | tag | string | — | `Official` or `Student-Led` |
- **Response (200):**
  ```json
  { "success": true, "count": 10, "events": [{ ..., "communityName", "comingCount", "busyCount", "myRsvp" }] }
  ```

---

### GET /api/events/:id

Get a single event. Non-approved events visible only to creator and moderators.

- **Auth required:** Yes
- **Response (200):**
  ```json
  { "success": true, "event": { "_id", "communityId", "creatorId", "creatorUsername", "title", "description", "imageUrl", "media", "eventDate", "comingCount", "busyCount", "myRsvp", "capacity", "status", "tag", "createdAt" } }
  ```

---

### DELETE /api/events/:id

Delete an event. Only the creator (or a moderator via moderator routes) can delete.

- **Auth required:** Yes
- **Response (200):**
  ```json
  { "success": true, "message": "Event deleted." }
  ```
- **Errors:** 403 (not creator), 404 (not found)

---

### POST /api/events/:id/rsvp

RSVP to an event.

- **Auth required:** Yes
- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | status | string | Yes | `"coming"`, `"busy"`, or `"none"` |
- **Response (200):**
  ```json
  { "success": true, "event": { ..., "comingCount", "busyCount", "myRsvp" } }
  ```
- **Notes:** Enforces capacity limit when RSVPing "coming". Only works on approved events.
- **Errors:** 400 (at capacity), 403 (not approved)

---

## Report Endpoints

### POST /api/reports

File a report against a piece of content.

- **Auth required:** Yes
- **Banned check:** Yes
- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | contentType | string | Yes | `"post"`, `"comment"`, `"reply"`, `"message"`, or `"event"` |
  | contentId | string | Yes | ObjectId of the content |
  | reason | string | No | Free-text explanation |
- **Response (201):**
  ```json
  { "success": true, "message": "Report submitted. Our moderators will review it.", "report": {...} }
  ```
- **Notes:** Cannot report your own content. Duplicate reports (same reporter + content) return 409.
- **Errors:** 400 (missing fields, self-report), 404 (content not found), 409 (duplicate)

---

## Request Endpoints

### POST /api/requests

Submit a free-text message/request to the moderators.

- **Auth required:** Yes
- **Banned check:** Yes
- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | message | string | Yes | Max 2000 characters |
  | communityId | string | No | If the request is about a specific community |
- **Response (201):**
  ```json
  { "success": true, "message": "Your request has been sent to the moderators.", "request": {...} }
  ```

---

## Upload Endpoints

### POST /api/uploads/media

Upload an image or video file to Cloudinary.

- **Auth required:** Yes
- **Content-Type:** `multipart/form-data`
- **Form field:** `file` — image or video (max 25 MB)
- **Accepted formats:** JPEG, PNG, GIF, WebP, MP4, WebM, MOV
- **Response (200):**
  ```json
  { "success": true, "url": "https://res.cloudinary.com/...", "mediaType": "image"|"video"|"gif" }
  ```

---

## Mod Messages Endpoints

### GET /api/mod-messages/my-conversation

Get the current user's moderator conversation thread (if any).

- **Auth required:** Yes
- **Response (200):**
  ```json
  { "success": true, "conversation": { "_id", "userId", "moderatorId", "userUsername", "moderatorUsername", "lastMessageAt", "lastPreview", "createdAt" } | null }
  ```

---

### GET /api/mod-messages/conversations

List all moderator conversations (moderator's inbox).

- **Auth required:** Yes
- **Moderator only:** Yes
- **Response (200):**
  ```json
  { "success": true, "count": 5, "conversations": [...] }
  ```

---

### GET /api/mod-messages/lookup-user?q=

Search for a user by username or id (for starting a conversation).

- **Auth required:** Yes
- **Moderator only:** Yes
- **Query params:**
  | Param | Type | Required |
  |-------|------|----------|
  | q | string | Yes |
- **Response (200):**
  ```json
  { "success": true, "user": { "id", "username", "email", "isBanned", "moderator", "existingConversationId", "assignedModeratorUsername" } | null }
  ```

---

### POST /api/mod-messages/start

Start (or resume) a direct conversation with a user.

- **Auth required:** Yes
- **Moderator only:** Yes
- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | userId / username / identifier | string | Yes | Target user id or username |
  | content | string | Conditional | Required if no media |
  | media | object | No | `{ url, mediaType: "image"|"video"|"gif" }` |
- **Response (201):**
  ```json
  { "success": true, "conversation": {...}, "message": {...} }
  ```
- **Errors:** 400 (self-message, messaging a mod), 404 (user not found), 409 (user already has conversation with another mod)

---

### GET /api/mod-messages/conversations/:conversationId/messages

List all messages in a conversation.

- **Auth required:** Yes (participant or moderator)
- **Response (200):**
  ```json
  { "success": true, "conversation": {...}, "messages": [{ "_id", "conversationId", "senderId", "senderRole", "senderUsername", "recipientId", "content", "media", "createdAt" }] }
  ```

---

### POST /api/mod-messages/conversations/:conversationId/messages

Send a message in an existing conversation.

- **Auth required:** Yes (participant or moderator)
- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | content | string | Conditional | Required if no media |
  | media | object | No | `{ url, mediaType }` |
- **Response (201):**
  ```json
  { "success": true, "message": {...}, "conversation": {...} }
  ```

---

## Moderator Endpoints

All moderator endpoints require both `protect` and `requireModerator` middleware (JWT + moderator flag).

### GET /api/moderator/posts

List posts for moderator review.

- **Query params:**
  | Param | Type | Default | Notes |
  |-------|------|---------|-------|
  | status | string | `pending` | `pending`, `approved`, `rejected`, `all` |
  | search | string | — | Search title, content, username, tag |
  | page | number | 1 | |
  | limit | number | 20 | Max 100 |
- **Response (200):**
  ```json
  { "success": true, "page", "limit", "total", "hasMore", "posts": [...] }
  ```

---

### POST /api/moderator/posts/:id/approve

Approve a pending post so it appears in community feeds.

- **Response (200):**
  ```json
  { "success": true, "message": "Post approved.", "post": {...} }
  ```

---

### POST /api/moderator/posts/:id/reject

Reject a post (it will never appear in feeds).

- **Response (200):**
  ```json
  { "success": true, "message": "Post rejected.", "post": {...} }
  ```

---

### GET /api/moderator/events

List events for moderator review.

- **Query params:** Same as posts (`status`, `search`, `page`, `limit`)
- **Response (200):**
  ```json
  { "success": true, "page", "limit", "total", "hasMore", "events": [...enriched with creatorUsername] }
  ```

---

### POST /api/moderator/events/:id/approve

Approve a pending event and assign a tag.

- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | tag | string | Yes | One of: `Official`, `Student-Led`, `Limited`, `Trending` |
- **Response (200):**
  ```json
  { "success": true, "message": "Event approved.", "event": {...} }
  ```

---

### POST /api/moderator/events/:id/reject

Reject a pending event.

- **Response (200):**
  ```json
  { "success": true, "message": "Event rejected.", "event": {...} }
  ```

---

### GET /api/moderator/communities

List/search all communities on the platform.

- **Query params:**
  | Param | Type | Notes |
  |-------|------|-------|
  | search | string | Filter by name or id |
  | type | string | `general` or `course` |
  | category | string | One of the category enums |
- **Response (200):**
  ```json
  { "success": true, "count": 50, "communities": [...] }
  ```

---

### POST /api/moderator/communities

Create a new general community.

- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | name | string | Yes | |
  | description | string | No | |
  | imageUrl | string | No | |
  | id | string | No | Custom slug; auto-derived from category+name if omitted |
  | category | string | No | Default `general`; one of CATALOG_CATEGORIES |
  | private | boolean | No | Default false |
- **Response (201):**
  ```json
  { "success": true, "community": {...} }
  ```

---

### PATCH /api/moderator/communities/:communityId

Update a community's name, image, category, or privacy.

- **Request body:**
  | Field | Type | Notes |
  |-------|------|-------|
  | name | string | Optional new name |
  | imageUrl | string | Optional image URL (null to clear) |
  | category | string | Only for general-type communities |
  | private | boolean | Cannot make course communities public |
- **Response (200):**
  ```json
  { "success": true, "community": {...} }
  ```

---

### POST /api/moderator/communities/:communityId/members

Add a user to a private community.

- **Request body:**
  | Field | Type | Required |
  |-------|------|----------|
  | userId | string | Yes (valid ObjectId) |
- **Response (200):**
  ```json
  { "success": true, "message": "Added <username> to <community>.", "community": {...} }
  ```

---

### DELETE /api/moderator/communities/:communityId

Delete a community and all its content (posts, comments, messages, events, reports).

- **Response (200):**
  ```json
  { "success": true, "message": "Community \"<name>\" deleted.", "communityId": "...", "deletedPosts": N, "deletedMessages": N }
  ```

---

### DELETE /api/moderator/communities/course

Delete ALL course communities and reset all users' schedules.

- **Response (200):**
  ```json
  { "success": true, "message": "Deleted N course communities...", "deletedCommunities": N, "deletedPosts": N, "deletedMessages": N }
  ```

---

### DELETE /api/moderator/communities/all

Delete ALL communities (general + course) and all related content.

- **Response (200):**
  ```json
  { "success": true, "message": "Deleted N communities.", "deletedCommunities": N, "deletedPosts": N, "deletedMessages": N }
  ```

---

### GET /api/moderator/communities/:communityId/posts

Browse any community's post feed (no access gate).

- **Query params:** `page`, `limit`
- **Response (200):**
  ```json
  { "success": true, "community": {...}, "page", "limit", "total", "hasMore", "posts": [...] }
  ```

---

### GET /api/moderator/communities/:communityId/messages

Browse any community's chat history (no access gate).

- **Query params:** `before` (ISO date), `limit` (default 50, max 200)
- **Response (200):**
  ```json
  { "success": true, "community": {...}, "count": N, "messages": [...] }
  ```

---

### GET /api/moderator/posts/:postId/comments

Browse the full comment tree for any post.

- **Response (200):**
  ```json
  { "success": true, "post": {...}, "count": N, "comments": [nested tree] }
  ```

---

### GET /api/moderator/users/:identifier

Look up a user by ObjectId or username. Returns profile + their content.

- **Params:** `identifier` — ObjectId string or username
- **Query params:** `page`, `limit`
- **Response (200):**
  ```json
  {
    "success": true,
    "user": { "id", "email", "username", "enrolledSections", "joinedCommunities", "scheduleUploaded", "isBanned", "moderator", "lastUsernameChange", "createdAt" },
    "page", "limit",
    "posts": { "total": N, "items": [...] },
    "comments": { "total": N, "items": [...] },
    "messages": { "total": N, "items": [...] }
  }
  ```

---

### PATCH /api/moderator/users/:id/ban

Ban or unban a user.

- **Request body:**
  | Field | Type | Required |
  |-------|------|----------|
  | banned | boolean | Yes |
- **Response (200):**
  ```json
  { "success": true, "message": "User banned."|"User unbanned.", "user": {...} }
  ```
- **Notes:** Cannot ban yourself or another moderator.

---

### DELETE /api/moderator/posts/:id

Delete any post (cascades comments + resolves reports).

- **Response (200):**
  ```json
  { "success": true, "message": "Post deleted (also removed N comment(s))." }
  ```

---

### DELETE /api/moderator/comments/:id

Delete any comment or reply (cascades descendants).

- **Response (200):**
  ```json
  { "success": true, "message": "Deleted N comment(s)/repl(ies)." }
  ```

---

### DELETE /api/moderator/messages/:id

Delete any chat message (resolves related reports).

- **Response (200):**
  ```json
  { "success": true, "message": "Message deleted." }
  ```

---

### DELETE /api/moderator/events/:id

Delete any event.

- **Response (200):**
  ```json
  { "success": true, "message": "Event deleted." }
  ```

---

### GET /api/moderator/reports

List content reports.

- **Query params:**
  | Param | Type | Default | Notes |
  |-------|------|---------|-------|
  | status | string | `pending` | `pending`, `resolved`, `dismissed`, `all` |
  | page | number | 1 | |
  | limit | number | 20 | Max 100 |
- **Response (200):**
  ```json
  { "success": true, "page", "limit", "total", "hasMore", "reports": [...] }
  ```

---

### POST /api/moderator/reports/:id/resolve

Resolve a report by deleting the content or dismissing.

- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | action | string | Yes | `"delete"` or `"dismiss"` (alias `"skip"`) |
- **Response (200):**
  ```json
  { "success": true, "message": "Content deleted and report resolved." | "Report dismissed.", "report"?: {...} }
  ```
- **Notes:** "delete" cascade-removes the reported content (post+comments, message, event, or comment).

---

### GET /api/moderator/requests

List user-submitted requests/messages.

- **Query params:**
  | Param | Type | Default | Notes |
  |-------|------|---------|-------|
  | status | string | `pending` | `pending`, `reviewed`, `dismissed`, `all` |
  | page | number | 1 | |
  | limit | number | 20 | Max 100 |
- **Response (200):**
  ```json
  { "success": true, "page", "limit", "total", "hasMore", "requests": [...] }
  ```

---

### POST /api/moderator/requests/:id/resolve

Mark a user request as reviewed or dismissed.

- **Request body:**
  | Field | Type | Required | Notes |
  |-------|------|----------|-------|
  | action | string | Yes | `"reviewed"` or `"dismissed"` |
- **Response (200):**
  ```json
  { "success": true, "message": "Request marked reviewed.|dismissed.", "request": {...} }
  ```
