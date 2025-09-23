import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { HttpStatusCode } from "axios";

const authService = new AuthService();

// Register a new user
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "First name, last name, email, and password are required."
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Please provide a valid email address."
      });
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Password must be at least 8 characters long."
      });
      return;
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
    console.error("Registration error:", error);
    
    if (error.message.includes("already exists")) {
      res.status(HttpStatusCode.Conflict).send({
        message: error.message
      });
      return;
    }

    res.status(HttpStatusCode.InternalServerError).send({
      message: "An error occurred during registration. Please try again."
    });
    return;
  }
}

// Confirm email verification
export async function confirmEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Verification token is required."
      });
      return;
    }

    await authService.confirmEmail(token);

    res.status(HttpStatusCode.Ok).send({
      message: "Email verified successfully. You can now log in."
    });
    return;

  } catch (error: any) {
    console.error("Email confirmation error:", error);
    
    if (error.message.includes("Invalid") || error.message.includes("expired")) {
      res.status(HttpStatusCode.BadRequest).send({
        message: error.message
      });
      return;
    }

    res.status(HttpStatusCode.InternalServerError).send({
      message: "An error occurred during email verification. Please try again."
    });
    return;
  }
}

// Login user
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Email and password are required."
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Please provide a valid email address."
      });
      return;
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
    console.error("Login error:", error);
    
    if (error.message.includes("Invalid") || error.message.includes("verify")) {
      res.status(HttpStatusCode.Unauthorized).send({
        message: error.message
      });
      return;
    }

    res.status(HttpStatusCode.InternalServerError).send({
      message: "An error occurred during login. Please try again."
    });
    return;
  }
}