import User from '../models/User.js';
import Community from '../models/Community.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { parseScheduleFile } from '../utils/scheduleParser.js';
import { serializeUser } from './authController.js';
import {
  isValidUsername,
  USERNAME_CHANGE_COOLDOWN_DAYS
} from '../utils/validators.js';

/**
 * USER CONTROLLER
 * ----------------------------------------------------------------------------
 * Profile reads, schedule upload (which unlocks course communities), and the
 * weekly-limited username change.
 */

/**
 * GET /api/users/me
 * Returns the authenticated user's profile (req.user is set by `protect`).
 */
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: serializeUser(req.user) });
});

/**
 * POST /api/users/me/schedule   (multipart/form-data, field "schedule")
 * Parses the uploaded UBC calendar file, stores the detected sections on the
 * user, and auto-provisions a "course" community for each section so students
 * have somewhere to land. Uploading is optional for the user overall, but if
 * they DO upload we expect to find at least one course.
 */
export const uploadScheduleFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No schedule file uploaded. Use form field "schedule".');
  }

  // 1) Extract normalized section ids (e.g. ["CPSC-110-101", "MATH-100-LEC"]).
  const sections = parseScheduleFile(req.file.buffer, req.file.originalname);

  if (sections.length === 0) {
    throw new ApiError(
      422,
      'Could not detect any courses in that file. Make sure it is your UBC schedule export (.ics).'
    );
  }

  // 2) Ensure a course community exists for each detected section. We use
  //    bulk upserts so re-uploading is idempotent and never duplicates rooms.
  await Promise.all(
    sections.map((sectionId) =>
      Community.updateOne(
        { _id: sectionId },
        {
          $setOnInsert: {
            _id: sectionId,
            name: sectionId.replace(/-/g, ' '), // "CPSC-110-101" -> "CPSC 110 101"
            description: `Community for ${sectionId} students.`,
            type: 'course',
            allowedTags: ['general', 'notes', 'questions', 'exams']
          }
        },
        { upsert: true }
      )
    )
  );

  // 3) Save the sections onto the user and flip the uploaded flag.
  req.user.enrolledSections = sections;
  req.user.scheduleUploaded = true;
  await req.user.save();

  res.json({
    success: true,
    message: `Schedule processed. You now have access to ${sections.length} course communities.`,
    enrolledSections: sections,
    user: serializeUser(req.user)
  });
});

/**
 * PATCH /api/users/me/username
 * Body: { username }
 * Enforces format rules, uniqueness, and the once-per-week cooldown.
 */
export const changeUsername = asyncHandler(async (req, res) => {
  const newUsername = (req.body.username || '').trim();

  if (!isValidUsername(newUsername)) {
    throw new ApiError(400, 'Username must be 3-20 characters: letters, numbers or underscores.');
  }

  // No-op if it's the same name.
  if (newUsername === req.user.username) {
    throw new ApiError(400, 'That is already your username.');
  }

  // Enforce the weekly cooldown based on lastUsernameChange.
  const cooldownMs = USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const nextAllowed = new Date(req.user.lastUsernameChange).getTime() + cooldownMs;
  if (Date.now() < nextAllowed) {
    const daysLeft = Math.ceil((nextAllowed - Date.now()) / (24 * 60 * 60 * 1000));
    throw new ApiError(
      429,
      `You can only change your username once every ${USERNAME_CHANGE_COOLDOWN_DAYS} days. Try again in ${daysLeft} day(s).`
    );
  }

  // Uniqueness check (the unique index is the final backstop).
  const taken = await User.findOne({ username: newUsername });
  if (taken) {
    throw new ApiError(409, 'That username is already taken.');
  }

  req.user.username = newUsername;
  req.user.lastUsernameChange = new Date();
  await req.user.save();

  res.json({
    success: true,
    message: 'Username updated.',
    user: serializeUser(req.user)
  });
});
