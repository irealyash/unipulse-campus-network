import User from '../models/User.js';
import Community from '../models/Community.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { parseScheduleFile } from '../utils/scheduleParser.js';
import { serializeUser } from './authController.js';
import { POST_TAGS } from './postController.js';
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
 * Parses an uploaded UBC schedule .xlsx, provisions private course communities
 * for each section, and enrolls the user in those sections.
 */
export const uploadScheduleFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No schedule file uploaded. Use form field "schedule".');
  }

  const sections = parseScheduleFile(req.file.buffer, req.file.originalname);

  if (sections.length === 0) {
    throw new ApiError(
      422,
      'Could not detect any course sections in that .xlsx file. Section extraction will be improved soon — ensure the file is your UBC schedule export.'
    );
  }

  await Promise.all(
    sections.map((sectionId) =>
      Community.updateOne(
        { _id: sectionId },
        {
          $setOnInsert: {
            _id: sectionId,
            name: sectionId.replace(/-/g, ' '),
            description: `Private community for ${sectionId} students.`,
            type: 'course',
            private: true,
            allowedTags: POST_TAGS,
          },
        },
        { upsert: true }
      )
    )
  );

  const merged = [...new Set([...(req.user.enrolledSections || []), ...sections])];
  req.user.enrolledSections = merged;
  req.user.scheduleUploaded = true;
  await req.user.save();

  res.json({
    success: true,
    message: `Schedule processed. You now have access to ${sections.length} course communit${sections.length === 1 ? 'y' : 'ies'}.`,
    enrolledSections: merged,
    addedSections: sections,
    user: serializeUser(req.user),
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

  if (newUsername === req.user.username) {
    throw new ApiError(400, 'That is already your username.');
  }

  const cooldownMs = USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const nextAllowed = new Date(req.user.lastUsernameChange).getTime() + cooldownMs;
  if (Date.now() < nextAllowed) {
    const daysLeft = Math.ceil((nextAllowed - Date.now()) / (24 * 60 * 60 * 1000));
    throw new ApiError(
      429,
      `You can only change your username once every ${USERNAME_CHANGE_COOLDOWN_DAYS} days. Try again in ${daysLeft} day(s).`
    );
  }

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
    user: serializeUser(req.user),
  });
});
