# UniPulse — Project Overview

## 1. Project Overview

**UniPulse** is a university community platform built for UBC (University of British Columbia) students. It provides anonymous, real-time communication spaces organized around course sections and interest groups. Students can chat, post, comment, create events, and engage with their university community — all while remaining anonymous behind mutable usernames.

Key principles:
- **University-gated access** — Only `@student.ubc.ca` emails can register (verified via OTP)
- **Anonymous participation** — Users interact via changeable aliases, never real names
- **Course integration** — Upload a Workday schedule to auto-join private course communities
- **Moderated content** — All posts and events require moderator approval before appearing publicly
- **Real-time chat** — Socket.io-powered live messaging within community chat rooms

---

## 2. Tech Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | — | JavaScript runtime |
| Express | 5.2.1 | HTTP framework (REST API) |
| MongoDB / Mongoose | 9.7.2 | Database & ODM |
| Socket.io | 4.8.3 | Real-time WebSocket communication |
| JSON Web Tokens (jsonwebtoken) | 9.0.3 | Stateless authentication |
| bcryptjs | 3.0.3 | Password hashing |
| Cloudinary | 2.10.0 | Cloud media storage (images, videos) |
| Multer | 2.2.0 | Multipart form-data parsing (file uploads) |
| Resend | 6.16.0 | Transactional email (OTP delivery) |
| bad-words | 4.0.0 | Profanity filter |
| xlsx | 0.18.5 | Excel spreadsheet parsing (schedule upload) |
| dotenv | 17.4.2 | Environment variable management |
| cors | 2.8.6 | Cross-origin request handling |
| nodemon | 3.1.14 | Dev server auto-restart |

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.7 | UI framework |
| React DOM | 19.2.7 | DOM rendering |
| Redux Toolkit | 2.12.0 | State management |
| React Redux | 9.3.0 | React-Redux bindings |
| React Router DOM | 7.18.0 | Client-side routing |
| Axios | 1.18.1 | HTTP client for API calls |
| Socket.io Client | 4.8.3 | Real-time WebSocket client |
| Tailwind CSS | 4.3.1 | Utility-first CSS framework |
| DaisyUI | 5.5.23 | Tailwind component library (themes) |
| Vite | 8.1.0 | Build tool & dev server |
| country-flag-icons | 1.6.19 | SVG country flag components |
| i18n-iso-countries | 7.14.0 | Country name/code utilities |
| ESLint | 10.5.0 | Code linting |

---

## 3. Architecture

UniPulse follows a **client-server architecture** with:

- **Frontend:** React Single-Page Application (SPA) with client-side routing (React Router 7)
- **Backend:** Express 5 REST API + Socket.io real-time server sharing the same HTTP port
- **Database:** MongoDB (document store) accessed via Mongoose ODM
- **Media:** Cloudinary for image/video storage; Multer for upload handling
- **Email:** Resend for transactional OTP emails
- **Auth:** Stateless JWT-based authentication

```
┌──────────────────┐        HTTP / WS        ┌──────────────────────────────┐
│   React SPA      │ ◄──────────────────────► │   Express + Socket.io        │
│   (Vite Dev)     │    REST API + WS         │   (Node.js)                  │
│                  │                          │                              │
│  Redux Store     │                          │  ┌─────────┐  ┌──────────┐  │
│  React Router    │                          │  │ Routes  │  │ Socket   │  │
│  Axios + io      │                          │  │ + Ctrl  │  │ Handlers │  │
└──────────────────┘                          │  └────┬────┘  └────┬─────┘  │
                                              │       │             │        │
                                              │       ▼             ▼        │
                                              │  ┌─────────────────────┐    │
                                              │  │   Mongoose Models    │    │
                                              │  └──────────┬──────────┘    │
                                              └─────────────┼───────────────┘
                                                            │
                                                            ▼
                                              ┌──────────────────────┐
                                              │       MongoDB        │
                                              └──────────────────────┘
```

---

## 4. Project Structure

### Backend (`backend/`)

| File/Directory | Description |
|---------------|-------------|
| `server.js` | Entry point: connects DB, configures Express, attaches Socket.io, starts listening |
| **config/** | |
| `config/db.js` | MongoDB connection setup using Mongoose |
| **models/** | |
| `models/User.js` | User schema (email, username, password, enrollment, ban status) |
| `models/Community.js` | Community schema (course sections + general interest groups) |
| `models/Post.js` | Post schema (title, content, media, voting, moderation status) |
| `models/Comment.js` | Comment schema (threaded replies, voting, media) |
| `models/Message.js` | Chat message schema (real-time messages with reactions) |
| `models/MessageReply.js` | Chat reply schema (threaded replies to messages) |
| `models/Event.js` | Event schema (RSVP, capacity, moderation, tags) |
| `models/Otp.js` | OTP schema (email verification + password reset with TTL) |
| `models/Reported.js` | Content report schema (user-filed reports for moderation) |
| `models/ModeratorRequest.js` | User request schema (free-text messages to mods) |
| `models/ModConversation.js` | Mod conversation schema (1:1 mod-user thread metadata) |
| `models/ModMessage.js` | Mod message schema (individual messages in mod conversations) |
| `models/reactionSchema.js` | Shared emoji reaction sub-schema (used in posts, comments, messages) |
| **controllers/** | |
| `controllers/authController.js` | Signup, verify, login, forgot/reset password, resend OTP |
| `controllers/userController.js` | Profile, schedule upload, join/leave community, username change |
| `controllers/communityController.js` | List navbar communities, browse catalog, get single community |
| `controllers/postController.js` | CRUD posts, reactions, emoji, pagination, feed sorting |
| `controllers/commentController.js` | CRUD comments/replies, threaded tree building, reactions |
| `controllers/messageController.js` | Chat history, timeline, message reactions |
| `controllers/messageReplyController.js` | Create/list/delete chat replies, reactions |
| `controllers/eventController.js` | CRUD events, RSVP, public event listing |
| `controllers/moderatorController.js` | Full moderation: content browsing, approval queues, banning, deletion |
| `controllers/moderatorRequestController.js` | User-facing: submit request to moderators |
| `controllers/reportController.js` | User-facing: file content reports |
| `controllers/uploadController.js` | Media file upload to Cloudinary |
| `controllers/modMessageController.js` | Moderator-user direct messaging system |
| **routes/** | |
| `routes/index.js` | Top-level router; mounts all sub-routers under /api |
| `routes/authRoutes.js` | Public auth endpoints (signup, verify, login, reset) |
| `routes/userRoutes.js` | Protected user/profile endpoints |
| `routes/communityRoutes.js` | Community listing + nested posts/events/chat |
| `routes/postRoutes.js` | Single-post routes + nested comments |
| `routes/commentRoutes.js` | Single-comment reactions + deletion |
| `routes/messageRoutes.js` | Message reactions + reply threads |
| `routes/messageReplyRoutes.js` | Reply reactions + deletion |
| `routes/eventRoutes.js` | Single-event routes + RSVP |
| `routes/moderatorRoutes.js` | Moderator-only admin routes |
| `routes/reportRoutes.js` | User report submission |
| `routes/requestRoutes.js` | User request submission |
| `routes/uploadRoutes.js` | Media upload endpoint |
| `routes/modMessageRoutes.js` | Mod-user messaging endpoints |
| **middleware/** | |
| `middleware/auth.js` | `protect` (JWT verify), `requireNotBanned`, `requireModerator` |
| `middleware/errorHandler.js` | `notFound` (404) + centralized error handler |
| `middleware/upload.js` | Multer config for .xlsx schedule uploads (5 MB, memory storage) |
| `middleware/mediaUpload.js` | Multer config for media uploads (25 MB, images/videos) |
| **socket/** | |
| `socket/chatSocket.js` | Socket.io event handlers: join/leave rooms, send messages, replies, reactions, deletion, typing indicators |
| **utils/** | |
| `utils/ApiError.js` | Custom error class with HTTP status code |
| `utils/asyncHandler.js` | Wraps async route handlers to forward errors to Express |
| `utils/token.js` | JWT signing and verification |
| `utils/password.js` | bcrypt hash and compare helpers |
| `utils/otp.js` | OTP generation, SHA-256 hashing, verification, expiry |
| `utils/sendEmail.js` | Resend email service for OTP delivery |
| `utils/cloudinary.js` | Cloudinary upload helper (buffer → URL) |
| `utils/postMedia.js` | Normalize and serialize post media arrays |
| `utils/avatars.js` | Generate default community/event images |
| `utils/validators.js` | Email, username, password validation rules |
| `utils/serializeVotes.js` | Serialize like/dislike state for API responses |
| `utils/likeDislike.js` | Apply like/dislike toggle logic on documents |
| `utils/emojiReaction.js` | Toggle emoji reactions on any content type |
| `utils/membership.js` | Community access authorization (enrolled, joined, public) |
| `utils/contentDeletion.js` | Cascade-delete posts, comments, messages, communities |
| `utils/communityCategories.js` | Category constants, slugify, ID generation |
| `utils/ensureCommunities.js` | Seed default communities on server boot |
| `utils/seedCommunityCatalog.js` | Bulk-insert community catalog data |
| `utils/moderators.js` | Check if email is a configured moderator |
| `utils/eventTags.js` | Event tag constants (Official, Student-Led, Limited, Trending) |
| `utils/scheduleParser.js` | Parse .xlsx schedule files into course section IDs |
| **data/** | |
| `data/communityCatalog.js` | Seed data for default communities |
| `data/countries.js` | Country name/code reference data |
| **scripts/** | |
| `scripts/seed.js` | Database seeding script (`npm run seed`) |
| `scripts/makeModerator.js` | CLI script to promote a user to moderator (`npm run make-moderator`) |

### Frontend (`frontend/src/`)

| File/Directory | Description |
|---------------|-------------|
| `main.jsx` | React app entry point (renders App with Redux Provider + Router) |
| `App.jsx` | Root component with route definitions |
| **app/** | |
| `app/store.js` | Redux store configuration (combines all slices) |
| **pages/** | |
| `pages/LandingPage.jsx` | Marketing/welcome page for unauthenticated visitors |
| `pages/LoginPage.jsx` | Login form |
| `pages/SignupPage.jsx` | Registration form |
| `pages/VerifyPage.jsx` | OTP verification form |
| `pages/ForgotPasswordPage.jsx` | Forgot password form |
| `pages/ResetPasswordPage.jsx` | Password reset form (with OTP) |
| `pages/CommunityOnboardingPage.jsx` | Post-signup community picker flow |
| `pages/CommunitiesPage.jsx` | Community browsing/discovery page |
| `pages/CommunityPage.jsx` | Single community view (wraps tabs) |
| `pages/CommunityHub.jsx` | Community hub/landing layout |
| `pages/CommunityHomeEmpty.jsx` | Empty state when no community selected |
| `pages/CommunityTabView.jsx` | Tabbed view within a community (posts/chat/events) |
| `pages/PostPage.jsx` | Single post detail with comments |
| `pages/EventPage.jsx` | Single event detail with RSVP |
| `pages/AllEventsPage.jsx` | All events listing page |
| `pages/AllEventsFeedPage.jsx` | Public event feed across all communities |
| `pages/SettingsPage.jsx` | User settings (username change, schedule) |
| `pages/SchedulePage.jsx` | Schedule upload page |
| `pages/ModeratorPage.jsx` | Moderator dashboard (approval queues, reports, users) |
| `pages/UserMessagesPage.jsx` | User's view of their moderator conversation |
| `pages/NotFoundPage.jsx` | 404 page |
| **components/layout/** | |
| `components/layout/CommunityShell.jsx` | Main authenticated layout shell (rail + sidebar + content) |
| `components/layout/CommunityRail.jsx` | Left icon rail (community avatars) |
| `components/layout/ChannelSidebar.jsx` | Channel/tab sidebar within a community |
| **components/chat/** | |
| `components/chat/ChatInput.jsx` | Chat message input with media/GIF support |
| `components/chat/MessageBubble.jsx` | Individual chat message display (reactions, replies) |
| `components/chat/GifPicker.jsx` | GIF search and selection UI |
| `components/chat/ReportModal.jsx` | Report content modal dialog |
| **components/community/** | |
| `components/community/PostsTab.jsx` | Posts feed tab within a community |
| `components/community/PostCommentSection.jsx` | Threaded comment tree renderer |
| `components/community/EventsTab.jsx` | Events list tab within a community |
| `components/community/EventParts.jsx` | Reusable event card components |
| `components/community/EventsFeed.jsx` | Events feed component |
| `components/community/ChatTab.jsx` | Real-time chat tab (Socket.io integration) |
| **components/modMessages/** | |
| `components/modMessages/ModMessageList.jsx` | Moderator conversation list |
| `components/modMessages/ModSendMessagePanel.jsx` | Moderator's message compose panel |
| `components/modMessages/ModUserMessagesPanel.jsx` | User's message view panel |
| **components/ (shared)** | |
| `components/Navbar.jsx` | Top navigation bar |
| `components/AuthShell.jsx` | Authentication page layout wrapper |
| `components/Logo.jsx` | UniPulse logo component |
| `components/Loader.jsx` | Loading spinner |
| `components/ThemeToggle.jsx` | Theme switcher (DaisyUI themes) |
| `components/Toasts.jsx` | Toast notification system |
| `components/ProtectedRoute.jsx` | Route guard (redirects if not authenticated) |
| `components/UserAvatar.jsx` | User avatar display |
| `components/CommunityAvatar.jsx` | Community avatar display |
| `components/CourseCommunityAvatar.jsx` | Course-specific community avatar |
| `components/CountryFlag.jsx` | Country flag icon component |
| `components/AddCommunityModal.jsx` | Modal to browse and join communities |
| `components/CommunityWelcomeModal.jsx` | Welcome dialog for new community members |
| `components/RequestModeratorModal.jsx` | Modal to send a request to moderators |
| `components/ReportFlagButton.jsx` | Report button (triggers report flow) |
| `components/TermsModal.jsx` | Terms of service modal |
| `components/PrivacyModal.jsx` | Privacy policy modal |
| `components/ScheduleUploadForm.jsx` | Schedule file upload form |
| `components/ScheduleUploadCard.jsx` | Schedule upload card UI |
| `components/icons.jsx` | Shared SVG icon components |
| **features/** (Redux slices) | |
| `features/auth/authSlice.js` | Auth state: login, signup, verify, token, user profile |
| `features/communities/communitiesSlice.js` | Communities state: list, catalog, join/leave |
| `features/posts/postsSlice.js` | Posts state: feed, CRUD, reactions |
| `features/chat/chatSlice.js` | Chat state: messages, replies, Socket.io integration |
| `features/events/eventsSlice.js` | Events state: list, create, RSVP |
| `features/moderator/moderatorSlice.js` | Moderator state: queues, user lookup, actions |
| `features/modMessages/modMessagesSlice.js` | Mod messages state: conversations, send/receive |
| **lib/** (utilities) | |
| `lib/api.js` | Axios instance configuration (base URL, auth interceptor) |
| `lib/socket.js` | Socket.io client instance and connection management |
| `lib/timeAgo.js` | Relative time formatting ("2 hours ago") |
| `lib/media.js` | Media URL helpers and type detection |
| `lib/votes.js` | Vote state computation helpers |
| `lib/avatars.js` | Avatar URL generation and fallbacks |
| `lib/favicon.js` | Dynamic favicon management |
| `lib/communityCategories.js` | Category labels and icons (mirrors backend) |
| `lib/communityNav.js` | Community navigation helpers |
| `lib/communityPins.js` | Pinned community persistence (localStorage) |
| `lib/navbarCommunities.js` | Navbar community list computation |
| `lib/countryCodes.js` | ISO country code utilities |
| `lib/eventTags.jsx` | Event tag display components |
| **hooks/** | |
| `hooks/usePinnedCommunities.js` | Hook for managing pinned communities in localStorage |
| `hooks/useDebouncedValue.js` | Generic debounce hook |

---

## 5. Data Flow

A typical request flows through the system as follows:

```
1. User Action (click, submit)
       │
       ▼
2. React Component dispatches Redux Thunk
       │
       ▼
3. Redux Thunk calls Axios (lib/api.js)
   → Axios attaches JWT from localStorage
       │
       ▼
4. HTTP Request hits Express Route
       │
       ▼
5. Middleware Chain:
   → protect (verify JWT, attach req.user)
   → requireNotBanned (for write operations)
   → requireModerator (for mod routes)
       │
       ▼
6. Controller Function
   → Validates input
   → Queries/mutates via Mongoose Model
       │
       ▼
7. Mongoose Model → MongoDB
   → Query executed against the collection
       │
       ▼
8. Response flows back:
   MongoDB → Mongoose → Controller → Express → Axios → Redux → React re-renders
```

---

## 6. Real-time Chat Flow

Chat uses Socket.io for instant message delivery alongside REST for history loading:

### Connection & Authentication
1. Frontend creates socket connection: `io(URL, { auth: { token } })`
2. Server `socketAuth` middleware verifies the JWT on handshake
3. On success, `socket.user` is set with the full user document

### Room Management
1. User navigates to a community's chat tab
2. Frontend emits `chat:join { communityId }`
3. Server verifies community access (enrollment for courses, public for general)
4. Socket joins the room; receives `chat:joined` acknowledgment

### Sending Messages
1. User types and sends → frontend emits `chat:message { communityId, content, media? }`
2. Server re-validates access (never trusts join state alone)
3. Message persisted to MongoDB (Message collection)
4. Server broadcasts `chat:message` to all room members (including sender)
5. All clients render the new message in real-time

### Replies
1. User replies → `chat:reply { parentId, content, media? }`
2. Server auto-detects if parent is a Message or MessageReply
3. Reply persisted; `chat:reply` broadcast to room with parent context

### Reactions (Live)
1. User reacts → `chat:react { targetType, targetId, action }` or `chat:emoji { targetType, targetId, emoji }`
2. Server applies mutation, saves, broadcasts `chat:reaction` with updated counts

### Deletion
1. User deletes own message → `chat:delete { targetType, targetId }`
2. Server cascade-deletes (message + all replies), broadcasts `chat:deleted { removedIds }`
3. All clients remove the deleted items from their UI

### Typing Indicators
1. User types → `chat:typing { communityId }`
2. Server broadcasts to others in room (not persisted)

---

## 7. Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  SIGNUP FLOW                                                     │
│                                                                  │
│  1. POST /api/auth/signup { email, username, password }          │
│     → Validates UBC email, username format, password strength    │
│     → Hashes password with bcrypt                                │
│     → Generates 6-digit OTP, hashes with SHA-256                 │
│     → Stores Otp doc (email, hash, pendingUsername, pendingPwd)  │
│     → Emails plaintext OTP via Resend                            │
│                                                                  │
│  2. POST /api/auth/verify { email, code }                        │
│     → Verifies code against stored hash                          │
│     → Creates User with stashed username + password hash         │
│     → Deletes Otp doc (single-use)                               │
│     → Signs JWT with user._id                                    │
│     → Returns token + serialized user                            │
│                                                                  │
│  3. Frontend stores token in localStorage                        │
│     → All subsequent requests include Authorization: Bearer <t>  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LOGIN FLOW                                                      │
│                                                                  │
│  1. POST /api/auth/login { identifier, password }                │
│     → Finds user by email OR username                            │
│     → Compares password with bcrypt                              │
│     → Checks ban status                                          │
│     → Signs and returns JWT                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PASSWORD RESET FLOW                                             │
│                                                                  │
│  1. POST /api/auth/forgot-password { email }                     │
│     → Generates reset OTP, emails it (silent no-op if no user)   │
│                                                                  │
│  2. POST /api/auth/reset-password { email, code, newPassword }   │
│     → Verifies code, updates user's password hash                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PROTECTED ROUTE ACCESS                                          │
│                                                                  │
│  Every request → protect middleware:                              │
│    1. Extract token from Authorization header                    │
│    2. Verify JWT signature + expiry                              │
│    3. Load User from DB by decoded.id                            │
│    4. Attach to req.user                                         │
│    5. Pass to next middleware/controller                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Key Features

### Communities

- **Two types:** Course sections (private, auto-created from schedule upload) and General communities (public catalog, moderator-managed)
- **Categories:** International, Academic, Residence, General, Faculty, Course
- **Joining:** Public communities are joined via the catalog browser; course communities via schedule upload; private communities via moderator invite
- **Pinning:** Users can pin/unpin communities in their navbar (persisted locally)
- **Custom string IDs:** Readable slugs like `intl-korean` or `CPSC-210-101`

### Posts

- **Moderation queue:** All new posts start as `pending` and require moderator approval
- **Tags:** Each post has a tag: General, Discussion, Question, Life Sucks, Humour, Angry, Confession
- **Media:** Multiple image/video/GIF attachments per post
- **Voting:** Reddit-style like/dislike with net score computation
- **Emoji reactions:** Free-form emoji reactions (multiple per user)
- **Sorting:** Feed sortable by "new" (chronological) or "top" (net score)
- **Pagination:** Page-based with configurable limit

### Comments

- **Threaded:** Unlimited nesting depth via parent-child self-reference
- **Media support:** Single image/video/GIF per comment
- **Voting + emoji:** Same reaction system as posts
- **Cascade deletion:** Deleting a comment removes all descendants
- **Anonymous:** Frozen username snapshot at comment creation time

### Chat (Real-time Messaging)

- **Socket.io:** Instant delivery via WebSocket rooms (one per community)
- **Message types:** Text, images, videos, GIFs
- **Replies:** Threaded replies to messages or other replies (unlimited depth)
- **Reactions:** Live like/dislike + emoji reactions broadcast to all room members
- **Typing indicators:** Transient "user is typing" notifications
- **Deletion:** Cascade-delete with live broadcast of removed IDs
- **History:** REST endpoint for loading older messages (infinite scroll)
- **Timeline:** Merged chronological feed of messages + replies

### Events

- **Moderation queue:** Events require approval; moderators assign tags on approval
- **Tags:** Official, Student-Led, Limited, Trending (assigned by moderator)
- **RSVP:** "I will come" / "I am busy" / "None" with public counts
- **Capacity:** Optional max attendee limit (enforced on RSVP)
- **Media:** Cover image + additional media attachments
- **Public feed:** Cross-community event discovery for public communities
- **Sorting:** By date or by RSVP count
- **Filtering:** By tag (Official, Student-Led)

### Moderator System

- **Content approval:** Posts and events must be approved before appearing publicly
- **Content browsing:** Moderators can browse ANY community's content (no access gates)
- **User lookup:** Search by username or ID; see all user's posts, comments, and messages
- **Banning:** Ban/unban users (banned users can read but not write)
- **Deletion:** Delete any post/comment/message/event platform-wide
- **Reports queue:** Review user-submitted content reports (delete content or dismiss)
- **Requests queue:** Review user messages/requests (mark reviewed or dismissed)
- **Community management:** Create, update, delete communities; add members to private communities
- **Promotion:** Via CLI script (`npm run make-moderator <email>`) or configured moderator emails

### Moderator-User Messaging

- **1:1 conversations:** Moderators can initiate direct threads with any non-moderator user
- **One conversation per user:** Each user has at most one active moderator thread
- **Bidirectional:** Both the user and the assigned moderator can send messages
- **Media support:** Messages can include images, videos, or GIFs
- **Inbox:** Moderators see a list of all their conversations sorted by recency
- **User view:** Users see their single moderator thread (if one exists)
- **Polling-based:** Uses REST polling (not Socket.io) for mod messages

### Schedule Upload

- **File format:** `.xlsx` exported from UBC Workday (View My Courses)
- **Parsing:** xlsx library extracts course section IDs (e.g. "CPSC-210-101")
- **Auto-provisioning:** Private course communities are created on-the-fly for each section
- **Enrollment:** User is automatically enrolled in all parsed sections
- **Re-upload:** Merges with existing sections (additive, not destructive)

### Reporting System

- **Content types:** Posts, comments, replies, messages, events
- **Anti-spam:** One report per user per content item (unique index)
- **Self-report blocked:** Cannot report your own content
- **Moderator review:** Reports appear in the moderator queue
- **Resolution:** Delete the content (cascade) or dismiss the report
- **Audit trail:** Who resolved it and when

### Theme System

- **DaisyUI themes:** Multiple built-in themes available
- **ThemeToggle component:** User can switch themes from the UI
- **Persistence:** Theme preference stored client-side
- **Responsive:** Full mobile + desktop support via Tailwind responsive utilities
