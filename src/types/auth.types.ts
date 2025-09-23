import type { Request, RequestHandler } from 'express';
import { IUser } from '../models/user.model';

// Extended Request interface with authenticated user
export interface AuthRequest extends Request {
  user: IUser;
}

// Type for authenticated route handlers
export type AuthRequestHandler = (req: AuthRequest, res: any, next: any) => Promise<void> | void;