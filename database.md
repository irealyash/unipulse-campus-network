# UniPulse Database Schema Documentation

All models use MongoDB via Mongoose 9. The database is connected in `backend/config/db.js` using the `MONGO_URI` environment variable.

---

## Shared Schema: emojiReactionSchema

**File:** `backend/models/reactionSchema.js`

An embedded sub-schema used in Posts, Comments, Messages, and MessageReplies to store free-form emoji reactions.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| emoji | String | Yes | The emoji character (e.g. "🔥") |
| userId | ObjectId (ref: User) | Yes | The user who reacted |

- `{ _id: false }` — no unique id per reaction entry (identified by emoji+userId pair)

---

## User

**File:** `backend/models/User.js`  
**Collection:** `users`  
**Purpose:** Represents a registered student on UniPulse.

### Fields

| Field | Type | Required | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| email | String | Yes | — | `unique`, `trim`, `lowercase` |
| username | String | Yes | — | `unique`, `trim` |
| password | String | Yes | — | `select: false` (excluded from queries by default); bcrypt hash |
| lastUsernameChange | Date | No | `Date.now` | Tracks cooldown for username changes |
| enrolledSections | [String] | No | `[]` | Course section IDs (e.g. "CPSC-110-L1A") |
| scheduleUploaded | Boolean | No | `false` | Whether user has uploaded their schedule |
| joinedCommunities | [String] | No | `[]` | Public catalog community IDs added to navbar |
| communityOnboardingComplete | Boolean | No | `false` | Post-signup community picker completion |
| isBanned | Boolean | No | `false` | Banned users cannot post/comment/chat |
| moderator | Boolean | No | `false` | Grants access to the moderator tab |
| createdAt | Date | No | `Date.now` | Account creation timestamp |

### Indexes

| Fields | Notes |
|--------|-------|
| `{ email: 1 }` | Unique (from schema) |
| `{ username: 1 }` | Unique (from schema) |
| `{ enrolledSections: 1 }` | Fast authorization for course channel access |

### Relationships

- Referenced by: Post.authorId, Comment.authorId, Message.senderId, MessageReply.senderId, Event.creatorId, Reported.reporterId/contentAuthorId, ModeratorRequest.senderId, ModConversation.userId/moderatorId, ModMessage.senderId/recipientId

---

## Community

**File:** `backend/models/Community.js`  
**Collection:** `communities`  
**Purpose:** Represents a discussion space — either a course section or a general interest group.

### Fields

| Field | Type | Required | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| _id | String | Yes | — | Custom slug ID (e.g. "CPSC-110-L1A" or "intl-korean"). NOT ObjectId |
| name | String | Yes | — | `trim`; human-readable display name |
| description | String | No | `""` | Community blurb |
| imageUrl | String | No | `null` | Profile image URL; defaults generated if omitted |
| type | String | No | `"general"` | `enum: ["general", "course"]` |
| category | String | No | `"general"` | `enum: ["international", "academic", "residence", "general", "faculty", "course"]` |
| private | Boolean | No | `false` | true = restricted access |
| members | [ObjectId] (ref: User) | No | `[]` | Moderator-invited members for private general communities |
| allowedTags | [String] | No | `["general"]` | Custom post tags allowed in this community |
| createdAt | Date | No | `Date.now` | |

### Indexes

| Fields | Notes |
|--------|-------|
| `{ private: 1, type: 1 }` | Quick public/private filtering by type |
| `{ category: 1, name: 1 }` | Alphabetical catalog pages |
| `{ members: 1 }` | Lookup communities a user is invited to |

### Relationships

- Referenced by: Post.communityId, Message.communityId, MessageReply.communityId, Event.communityId, Reported.communityId, ModeratorRequest.communityId
- References: User (via members array)

---

## Post

**File:** `backend/models/Post.js`  
**Collection:** `posts`  
**Purpose:** A user-submitted post within a community. Goes through moderator review before appearing in feeds.

### Fields

| Field | Type | Required | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| communityId | String | Yes | — | References Community._id |
| authorId | ObjectId (ref: User) | Yes | — | |
| anonymousUsername | String | Yes | — | Frozen snapshot of author's username at post time |
| title | String | Yes | — | `trim` |
| content | String | Yes | — | Post body text |
| media | Array of `{ url: String (required), mediaType: String (required, enum: ['image','video','gif']) }` | No | `[]` | |
| tag | String | No | `null` | `trim`; community-specific post tag |
| likes | [ObjectId] (ref: User) | No | `[]` | Users who liked |
| dislikes | [ObjectId] (ref: User) | No | `[]` | Users who disliked |
| reactions | [emojiReactionSchema] | No | `[]` | Free-form emoji reactions |
| commentCount | Number | No | `0` | Cached count for feed display |
| status | String | No | `"pending"` | `enum: ['pending', 'approved', 'rejected']` |
| reviewedBy | ObjectId (ref: User) | No | `null` | Moderator who reviewed |
| reviewedAt | Date | No | `null` | |
| createdAt | Date | No | `Date.now` | |

### Virtuals

| Name | Computation |
|------|-------------|
| score | `likes.length - dislikes.length` |

### Indexes

| Fields | Notes |
|--------|-------|
| `{ communityId: 1, status: 1, createdAt: -1 }` | Community feed sorted by newest |
| `{ status: 1, createdAt: -1 }` | Moderator review queue |

### Serialization

- `toJSON` and `toObject` include virtuals

### Relationships

- Referenced by: Comment.postId, Reported.contentId/postId

---

## Comment

**File:** `backend/models/Comment.js`  
**Collection:** `comments`  
**Purpose:** Threaded comments on posts. Supports nested replies via self-reference.

### Fields

| Field | Type | Required | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| postId | ObjectId (ref: Post) | Yes | — | |
| parentId | ObjectId (ref: Comment) | No | `null` | null = top-level comment; set = reply |
| authorId | ObjectId (ref: User) | Yes | — | |
| anonymousUsername | String | Yes | — | Frozen alias snapshot |
| content | String | No | `""` | Can be empty if media-only |
| media.url | String | No | `null` | |
| media.mediaType | String | No | `null` | `enum: ['image', 'video', 'gif', null]` |
| likes | [ObjectId] (ref: User) | No | `[]` | |
| dislikes | [ObjectId] (ref: User) | No | `[]` | |
| reactions | [emojiReactionSchema] | No | `[]` | |
| createdAt | Date | No | `Date.now` | |

### Virtuals

| Name | Computation |
|------|-------------|
| score | `likes.length - dislikes.length` |

### Indexes

| Fields | Notes |
|--------|-------|
| `{ postId: 1, parentId: 1 }` | Efficient retrieval of a post's full comment map |

### Serialization

- `toJSON` and `toObject` include virtuals

---

## Message

**File:** `backend/models/Message.js`  
**Collection:** `messages`  
**Purpose:** A real-time chat message in a community's live chat room.

### Fields

| Field | Type | Required | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| communityId | String | Yes | — | References Community._id |
| senderId | ObjectId (ref: User) | Yes | — | |
| anonymousUsername | String | Yes | — | Frozen alias snapshot |
| content | String | No | `""` | Can be empty if media-only |
| media.url | String | No | `null` | |
| media.mediaType | String | No | `null` | `enum: ['image', 'video', 'gif', null]` |
| likes | [ObjectId] (ref: User) | No | `[]` | |
| dislikes | [ObjectId] (ref: User) | No | `[]` | |
| reactions | [emojiReactionSchema] | No | `[]` | |
| createdAt | Date | No | `Date.now` | |

### Virtuals

| Name | Computation |
|------|-------------|
| score | `likes.length - dislikes.length` |

### Indexes

| Fields | Notes |
|--------|-------|
| `{ communityId: 1, createdAt: -1 }` | Reverse-chronological pagination for chat load |

### Serialization

- `toJSON` and `toObject` include virtuals

---

## MessageReply

**File:** `backend/models/MessageReply.js`  
**Collection:** `messagereplies`  
**Purpose:** Threaded replies within group chat. A reply can reference a Message or another MessageReply (nested threading).

### Fields

| Field | Type | Required | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| communityId | String | Yes | — | Mirrors parent's community |
| parentMessageId | ObjectId | Yes | — | ID of parent Message or MessageReply |
| parentType | String | No | `"message"` | `enum: ['message', 'reply']`; hint for frontend |
| senderId | ObjectId (ref: User) | Yes | — | |
| anonymousUsername | String | Yes | — | Frozen alias snapshot |
| content | String | No | `""` | |
| media.url | String | No | `null` | |
| media.mediaType | String | No | `null` | `enum: ['image', 'video', 'gif', null]` |
| likes | [ObjectId] (ref: User) | No | `[]` | |
| dislikes | [ObjectId] (ref: User) | No | `[]` | |
| reactions | [emojiReactionSchema] | No | `[]` | |
| createdAt | Date | No | `Date.now` | |

### Virtuals

| Name | Computation |
|------|-------------|
| score | `likes.length - dislikes.length` |

### Indexes

| Fields | Notes |
|--------|-------|
| `{ parentMessageId: 1, createdAt: 1 }` | Fetch children of any node |
| `{ communityId: 1, createdAt: -1 }` | Moderation/listing all replies in a room |

### Serialization

- `toJSON` and `toObject` include virtuals

---

## Event

**File:** `backend/models/Event.js`  
**Collection:** `events`  
**Purpose:** Community events with RSVP, capacity limits, and moderator approval.

### Fields

| Field | Type | Required | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| communityId | String | Yes | — | References Community._id |
| creatorId | ObjectId (ref: User) | Yes | — | |
| creatorUsername | String | No | `""` | `trim` |
| title | String | Yes | — | `trim` |
| description | String | No | — | |
| imageUrl | String | No | `null` | Cover/profile image |
| media | Array of `{ url: String (required), mediaType: String (required, enum: ['image','video','gif']) }` | No | `[]` | |
| eventDate | Date | Yes | — | When the event occurs |
| coming | [ObjectId] (ref: User) | No | `[]` | RSVPed "coming" |
| busy | [ObjectId] (ref: User) | No | `[]` | RSVPed "busy" |
| capacity | Number | No | `null` | Max attendees; null = unlimited; `min: 1` |
| status | String | No | `"pending"` | `enum: ['pending', 'approved', 'rejected']` |
| reviewedBy | ObjectId (ref: User) | No | `null` | |
| reviewedAt | Date | No | `null` | |
| tag | String | No | `null` | `enum: ['Official', 'Student-Led', 'Limited', 'Trending']`; assigned by moderator on approval |
| moderatorNote | String | No | `""` | `trim`; private creator note for moderators |
| createdAt | Date | No | `Date.now` | |

### Indexes

| Fields | Notes |
|--------|-------|
| `{ communityId: 1, status: 1, eventDate: 1 }` | Loading upcoming events in a community |
| `{ status: 1, createdAt: -1 }` | Moderator review queue |

---

## Otp

**File:** `backend/models/Otp.js`  
**Collection:** `otps`  
**Purpose:** One-time password documents for email verification (signup) and password reset flows.

### Fields

| Field | Type | Required | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| email | String | Yes | — | `lowercase`, `trim`, `index: true` |
| codeHash | String | Yes | — | SHA-256 hash of the 6-digit code |
| purpose | String | Yes | — | `enum: ['signup', 'reset']` |
| pendingUsername | String | No | `null` | Stashed desired username during signup |
| pendingPasswordHash | String | No | `null` | Stashed bcrypt hash during signup |
| attempts | Number | No | `0` | Brute-force counter |
| expiresAt | Date | Yes | — | Absolute expiry timestamp |

### Options

- `{ timestamps: true }` — auto-managed `createdAt` and `updatedAt`

### Indexes

| Fields | Notes |
|--------|-------|
| `{ email: 1 }` | Fast lookup by email |
| `{ expiresAt: 1 }` | TTL index with `expireAfterSeconds: 0` — MongoDB auto-deletes expired docs |

### Notes

- The raw OTP code is NEVER stored — only its SHA-256 hash
- Signup OTPs carry pending credentials; reset OTPs don't
- Auto-cleaned by MongoDB TTL when `expiresAt` passes

---

## Reported

**File:** `backend/models/Reported.js`  
**Collection:** `reporteds`  
**Purpose:** Records content reports filed by users for moderator review.

### Fields

| Field | Type | Required | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| contentType | String | Yes | — | `enum: ['post', 'comment', 'reply', 'message', 'event']` |
| contentId | ObjectId | Yes | — | ID of the reported content document |
| postId | ObjectId (ref: Post) | No | `null` | Set for comments/replies (the parent post) |
| communityId | String | No | `null` | The community the content lives in |
| contentAuthorId | ObjectId (ref: User) | Yes | — | Author of the reported content |
| contentAuthorUsername | String | Yes | — | Frozen alias at report time |
| reporterId | ObjectId (ref: User) | Yes | — | Who filed the report |
| reporterUsername | String | Yes | — | Frozen alias at report time |
| reason | String | No | `""` | `trim`; free-text reason |
| status | String | No | `"pending"` | `enum: ['pending', 'resolved', 'dismissed']` |
| resolvedBy | ObjectId (ref: User) | No | `null` | Moderator who acted |
| resolvedAt | Date | No | `null` | When the report was resolved |
| createdAt | Date | No | `Date.now` | |

### Indexes

| Fields | Notes |
|--------|-------|
| `{ reporterId: 1, contentId: 1 }` | **Unique** — one report per user per content (anti-spam) |
| `{ status: 1, createdAt: -1 }` | Moderator queue: pending reports, newest first |

---

## ModeratorRequest

**File:** `backend/models/ModeratorRequest.js`  
**Collection:** `moderatorrequests`  
**Purpose:** Free-text messages from users to moderators requesting community updates/changes.

### Fields

| Field | Type | Required | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| senderId | ObjectId (ref: User) | Yes | — | |
| senderUsername | String | Yes | — | Frozen alias at submission time |
| communityId | String | No | `null` | Community the request is about (if any) |
| message | String | Yes | — | `trim`, `maxlength: 2000` |
| status | String | No | `"pending"` | `enum: ['pending', 'reviewed', 'dismissed']` |
| handledBy | ObjectId (ref: User) | No | `null` | Moderator who handled it |
| handledAt | Date | No | `null` | |
| createdAt | Date | No | `Date.now` | |

### Indexes

| Fields | Notes |
|--------|-------|
| `{ status: 1, createdAt: -1 }` | Moderator queue: newest pending first |

---

## ModConversation

**File:** `backend/models/ModConversation.js`  
**Collection:** `modconversations`  
**Purpose:** A direct-message thread between a student and the moderator who contacted them. Each user may only have one active conversation.

### Fields

| Field | Type | Required | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| userId | ObjectId (ref: User) | Yes | — | **unique** — one conversation per user |
| moderatorId | ObjectId (ref: User) | Yes | — | |
| userUsername | String | Yes | — | `trim` |
| moderatorUsername | String | Yes | — | `trim` |
| lastMessageAt | Date | No | `Date.now` | |
| lastPreview | String | No | `""` | `maxlength: 200`, `trim`; preview of last message |
| createdAt | Date | No | `Date.now` | |
| updatedAt | Date | No | `Date.now` | |

### Pre-save Hook

- Sets `updatedAt = new Date()` before every save

### Indexes

| Fields | Notes |
|--------|-------|
| `{ userId: 1 }` | Unique (from schema) |
| `{ moderatorId: 1, lastMessageAt: -1 }` | Moderator inbox sorted by recency |

---

## ModMessage

**File:** `backend/models/ModMessage.js`  
**Collection:** `modmessages`  
**Purpose:** Individual messages within a moderator-user conversation thread.

### Embedded Sub-Schema: modMessageMediaSchema

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| url | String | Yes | `trim` |
| mediaType | String | Yes | `enum: ['image', 'video', 'gif']` |

`{ _id: false }`

### Fields

| Field | Type | Required | Default | Validation / Notes |
|-------|------|----------|---------|-------------------|
| conversationId | ObjectId (ref: ModConversation) | Yes | — | |
| senderId | ObjectId (ref: User) | Yes | — | |
| senderRole | String | Yes | — | `enum: ['moderator', 'user']` |
| senderUsername | String | Yes | — | `trim` |
| recipientId | ObjectId (ref: User) | Yes | — | |
| content | String | No | `""` | `trim` |
| media | modMessageMediaSchema | No | `null` | |
| createdAt | Date | No | `Date.now` | |

### Indexes

| Fields | Notes |
|--------|-------|
| `{ conversationId: 1, createdAt: 1 }` | Load messages in a conversation chronologically |
