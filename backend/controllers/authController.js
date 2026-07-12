import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCK_TIME_MS =
  (parseInt(process.env.LOCK_TIME_MINUTES) || 15) * 60 * 1000;

// @desc  Register a new user
// @route POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error("========== ERROR ==========");
    console.error(error);
    console.error(error.stack);

    res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

// @desc  Login user with lockout logic
// @route POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Email, password, and role are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if account is currently locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        message: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
        locked: true,
      });
    }

    // If lock has expired, reset attempts
    if (user.lockUntil && user.lockUntil <= Date.now()) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
    }

    // Check role match
    if (user.role !== role) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_TIME_MS;
        await user.save();
        return res.status(423).json({
          message: `Account locked after ${MAX_ATTEMPTS} failed attempts. Try again in ${LOCK_TIME_MS / 60000} minutes.`,
          locked: true,
        });
      }

      await user.save();
      const attemptsLeft = MAX_ATTEMPTS - user.failedLoginAttempts;
      return res.status(401).json({
        message: "Invalid credentials",
        attemptsLeft,
      });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "Account is deactivated. Contact admin." });
    }

    // Successful login — reset attempts
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error("========== ERROR ==========");
    console.error(error);
    console.error(error.stack);

    res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

// @desc  Get logged-in user profile
// @route GET /api/auth/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("========== ERROR ==========");
    console.error(error);
    console.error(error.stack);

    res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};