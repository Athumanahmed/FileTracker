import { asyncHandler } from "../utils/asyncHandler.js";
import * as forgotPasswordService from "../services/forgotPassword.service.js";

const extractBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
};

export const forgotPassword = asyncHandler(async (req, res) => {
  const { message } = await forgotPasswordService.requestPasswordReset({
    phoneNumber: req.body.phoneNumber,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message });
});

export const resendResetOtp = asyncHandler(async (req, res) => {
  const { message } = await forgotPasswordService.resendResetOtp({
    phoneNumber: req.body.phoneNumber,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message });
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const { resetToken } = await forgotPasswordService.verifyResetOtp({
    phoneNumber: req.body.phoneNumber,
    otp: req.body.otp,
    ipAddress: req.ip,
  });

  res.status(200).json({
    success: true,
    message: "OTP verified successfully.",
    data: { resetToken },
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await forgotPasswordService.resetPassword({
    resetToken: extractBearerToken(req),
    newPassword: req.body.newPassword,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: "Password reset successfully." });
});
