import { Router } from "express";
import { register, confirmEmail, login } from "../controllers/auth.controller";

const router = Router();

// POST /auth/register - Register a new user
router.post("/register", register);

// POST /auth/confirm-email - Confirm email verification
router.post("/confirm-email", confirmEmail);

// POST /auth/login - Login user
router.post("/login", login);

export default router;