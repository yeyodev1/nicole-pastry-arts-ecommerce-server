import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { HttpStatusCode } from "axios";
import { handleControllerError, createValidationError } from "../utils/error-handler";

const authService = new AuthService();

// Register a new user
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      throw createValidationError("First name, last name, email, and password are required.");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createValidationError("Please provide a valid email address.");
    }

    // Validate password strength
    if (password.length < 8) {
      throw createValidationError("Password must be at least 8 characters long.");
    }

    const result = await authService.registerUser({
      firstName,
      lastName,
      email,
      password,
      phone
    });

    res.status(HttpStatusCode.Created).send({
      message: "User registered successfully. Please check your email to verify your account.",
      user: result.user,
      verificationToken: result.verificationToken
    });
    return;

  } catch (error: any) {
    handleControllerError(error, res, "Registration");
    return;
  }
}

// Confirm email verification
export async function confirmEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      throw createValidationError("Verification token is required.");
    }

    await authService.confirmEmail(token);

    res.status(HttpStatusCode.Ok).send({
      message: "Email verified successfully. You can now log in."
    });
    return;

  } catch (error: any) {
    handleControllerError(error, res, "Email confirmation");
    return;
  }
}

// Login user
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw createValidationError("Email and password are required.");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createValidationError("Please provide a valid email address.");
    }

    const result = await authService.loginUser({
      email,
      password
    });

    res.status(HttpStatusCode.Ok).send({
      message: "Login successful.",
      user: result.user,
      token: result.token
    });
    return;

  } catch (error: any) {
    handleControllerError(error, res, "Login");
    return;
  }
}