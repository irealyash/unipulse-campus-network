import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    // The current active anonymous alias across UniPulse
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // Bcrypt hash of the user's password (set during signup, after email
    // verification). `select: false` keeps it out of normal queries so it is
    // never accidentally serialized; login must explicitly .select('+password').
    password: {
        type: String,
        required: true,
        select: false
    },
    // Tracking timestamp to enforce cooldown limits (e.g., change allowed once every 7 days)
    lastUsernameChange: {
        type: Date,
        default: Date.now // Defaults to registration date
    },
    // Populated by parsing the schedule file (e.g., ["CPSC-110-L1A", "MATH-100-101"])
    // Determines which course-specific communities the user is allowed to enter.
    enrolledSections: {
        type: [String],
        default: []
    },
    // Quick flag so the frontend knows whether to keep nudging the user to upload
    // their schedule. Users who skip this stay false and only see general communities.
    scheduleUploaded: {
        type: Boolean,
        default: false
    },
    // Moderation flag. A banned user is blocked from posting, commenting and chatting.
    isBanned: {
        type: Boolean,
        default: false
    },
    // When true the user gains access to the moderator tab: platform-wide power
    // to browse every community, look up any user's content by id/username,
    // delete any post/comment/reply, review reports, and ban users.
    // Promote a user with `npm run make-moderator <email>` (no public endpoint).
    moderator: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index to instantly authorize users entering course channels or posting
userSchema.index({ enrolledSections: 1 });

export default mongoose.model('User', userSchema);