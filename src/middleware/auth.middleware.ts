import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthService } from '../services/auth.service';
import { HttpStatusCode } from 'axios';
import { AuthRequest } from '../types/auth.types';

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // Middleware to verify JWT token from Authorization header
  authenticate: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(HttpStatusCode.Unauthorized).send({
          message: "Access denied. No token provided."
        });
        return;
      }

      // Extract token from "Bearer <token>" format
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      if (!token) {
        res.status(HttpStatusCode.Unauthorized).send({
          message: "Access denied. Invalid token format."
        });
        return;
      }

      // Verify token and get user ID
      const decoded = this.authService.verifyToken(token);
      
      // Get user from database
      const user = await this.authService.getUserById(decoded.userId);
      
      if (!user) {
        res.status(HttpStatusCode.Unauthorized).send({
          message: "Access denied. User not found."
        });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        res.status(HttpStatusCode.Unauthorized).send({
          message: "Access denied. User account is inactive."
        });
        return;
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        res.status(HttpStatusCode.Unauthorized).send({
          message: "Access denied. Please verify your email address."
        });
        return;
      }

      // Attach user to request object
      (req as AuthRequest).user = user;
      
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      
      if (error instanceof Error && error.message === 'Invalid or expired token') {
        res.status(HttpStatusCode.Unauthorized).send({
          message: "Access denied. Invalid or expired token."
        });
        return;
      }

      res.status(HttpStatusCode.InternalServerError).send({
        message: "Internal server error during authentication."
      });
      return;
    }
  };

  // Middleware to check if user has specific role
  authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const authReq = req as AuthRequest;
      
      if (!authReq.user) {
        res.status(HttpStatusCode.Unauthorized).send({
          message: "Access denied. User not authenticated."
        });
        return;
      }

      if (!roles.includes(authReq.user.role)) {
        res.status(HttpStatusCode.Forbidden).send({
          message: "Access denied. Insufficient permissions."
        });
        return;
      }

      next();
    };
  };

  // Middleware for admin-only routes
  adminOnly = (req: Request, res: Response, next: NextFunction): void => {
    this.authorize(['admin'])(req, res, next);
  };

  // Middleware for staff and admin routes
  staffOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
    this.authorize(['staff', 'admin'])(req, res, next);
  };
}

// Export singleton instance
export const authMiddleware = new AuthMiddleware();