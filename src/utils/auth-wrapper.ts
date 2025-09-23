import type { RequestHandler } from 'express';
import { AuthRequest, AuthRequestHandler } from '../types/auth.types';

// Wrapper function to convert AuthRequestHandler to Express RequestHandler
export function wrapAuthHandler(handler: AuthRequestHandler): RequestHandler {
  return handler as RequestHandler;
}