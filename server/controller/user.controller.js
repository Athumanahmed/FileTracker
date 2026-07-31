import { asyncHandler } from "../utils/asyncHandler.js";
import * as userService from "../services/user.service.js";

/**
 * One controller shared by every "create X" route -- the only thing that
 * differs per route is which target role code it's bound to at mount
 * time. All authorization/scope/validation business logic lives in the
 * service, not here.
 */
export const createUserHandler = (targetRoleCode) =>
  asyncHandler(async (req, res) => {
    const { user, defaultPassword } = await userService.createUser({
      creatorUserId: req.user.userId,
      targetRoleCode,
      payload: req.body,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: {
        user,
        // Shown exactly once -- the admin must relay this to the new user
        // out of band; it cannot be retrieved again after this response.
        defaultPassword,
      },
    });
  });
