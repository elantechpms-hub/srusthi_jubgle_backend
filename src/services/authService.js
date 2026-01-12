const OTPToken = require('../models/OTPToken');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('./emailService');
const AuditLog = require('../models/AuditLog');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

const sendOTP = async (email) => {
  email = email.toLowerCase().trim();

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User with this email does not exist');
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Remove old OTPs
  await OTPToken.deleteMany({ email });

  // Create new OTP
  await OTPToken.create({ email, otp, expiresAt });

  // Send email
  await sendEmail({
    to: email,
    subject: 'Your Login OTP - The Core Pench',
    html: `
      <h2>Your One-Time Password (OTP)</h2>
      <p>Use this OTP to log in:</p>
      <h1 style="font-size: 32px; letter-spacing: 8px;"><strong>${otp}</strong></h1>
      <p>This OTP is valid for 5 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });

  await AuditLog.create({
    userId: null,
    userName: email,
    activity: 'OTP sent for login',
    time: new Date().toISOString(),
    additionalData: { email }
  });
};

const verifyOTPAndLogin = async (email, otp) => {
  email = email.toLowerCase().trim();

  const otpToken = await OTPToken.findOne({
    email,
    otp,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpToken) {
    throw new Error('Invalid or expired OTP');
  }

  const user = await User.findOne({ email });
  if (!user || !user.isActive) {
    throw new Error('Invalid credentials or account deactivated');
  }

  // Mark OTP as used
  otpToken.isUsed = true;
  await otpToken.save();

  // Update last login
  user.lastLogin = new Date();
  user.loginAttempts = 0;
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await AuditLog.create({
    userId: user._id,
    userName: user.name,
    activity: 'User logged in successfully',
    time: new Date().toISOString(),
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

module.exports = {
  sendOTP,
  verifyOTPAndLogin,
  generateAccessToken,
  generateRefreshToken,
};