import type { Response } from "express";
import { HttpStatusCode } from "axios";

export interface ErrorResponse {
  message: string;
  error?: string;
  statusCode: number;
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = HttpStatusCode.InternalServerError) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleControllerError(
  error: any,
  res: Response,
  context: string = "Operation"
): void {
  console.error(`${context} error:`, error);

  // Handle custom AppError
  if (error instanceof AppError) {
    res.status(error.statusCode).send({
      message: error.message,
      statusCode: error.statusCode
    });
    return;
  }

  // Handle specific known errors
  if (error.message) {
    // Authentication/Authorization errors
    if (error.message.includes("Invalid") || 
        error.message.includes("verify") || 
        error.message.includes("Unauthorized")) {
      res.status(HttpStatusCode.Unauthorized).send({
        message: error.message,
        statusCode: HttpStatusCode.Unauthorized
      });
      return;
    }

    // Validation errors
    if (error.message.includes("required") || 
        error.message.includes("invalid") ||
        error.message.includes("format")) {
      res.status(HttpStatusCode.BadRequest).send({
        message: error.message,
        statusCode: HttpStatusCode.BadRequest
      });
      return;
    }

    // Conflict errors (duplicate data)
    if (error.message.includes("already exists") || 
        error.message.includes("duplicate")) {
      res.status(HttpStatusCode.Conflict).send({
        message: error.message,
        statusCode: HttpStatusCode.Conflict
      });
      return;
    }

    // Not found errors
    if (error.message.includes("not found") || 
        error.message.includes("does not exist")) {
      res.status(HttpStatusCode.NotFound).send({
        message: error.message,
        statusCode: HttpStatusCode.NotFound
      });
      return;
    }

    // Email service errors
    if (error.message.includes("Failed to send email") || 
        error.message.includes("email")) {
      res.status(HttpStatusCode.ServiceUnavailable).send({
        message: "Email service is temporarily unavailable. Please try again later.",
        error: error.message,
        statusCode: HttpStatusCode.ServiceUnavailable
      });
      return;
    }
  }

  // MongoDB/Mongoose errors
  if (error.name === 'ValidationError') {
    res.status(HttpStatusCode.BadRequest).send({
      message: "Validation error occurred.",
      error: error.message,
      statusCode: HttpStatusCode.BadRequest
    });
    return;
  }

  if (error.name === 'CastError') {
    res.status(HttpStatusCode.BadRequest).send({
      message: "Invalid data format provided.",
      statusCode: HttpStatusCode.BadRequest
    });
    return;
  }

  // Default internal server error
  res.status(HttpStatusCode.InternalServerError).send({
    message: `An error occurred during ${context.toLowerCase()}. Please try again.`,
    statusCode: HttpStatusCode.InternalServerError
  });
}

// Specific error creators for common scenarios
export const createValidationError = (message: string) => 
  new AppError(message, HttpStatusCode.BadRequest);

export const createNotFoundError = (resource: string) => 
  new AppError(`${resource} not found.`, HttpStatusCode.NotFound);

export const createUnauthorizedError = (message: string = "Unauthorized access.") => 
  new AppError(message, HttpStatusCode.Unauthorized);

export const createConflictError = (message: string) => 
  new AppError(message, HttpStatusCode.Conflict);

export const createEmailServiceError = (message: string = "Email service unavailable.") => 
  new AppError(message, HttpStatusCode.ServiceUnavailable);