import bcrypt from "bcryptjs";
import { securityConfig } from "../config/security.js";

export const hashPassword = (plainPassword) =>
  bcrypt.hash(plainPassword, securityConfig.bcryptSaltRounds);

export const verifyPassword = (plainPassword, passwordHash) =>
  bcrypt.compare(plainPassword, passwordHash);
