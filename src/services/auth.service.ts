import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import crypto from 'crypto';
import models from '../models';
import { IUser } from '../models/user.model';
import { ResendService } from './resend.service';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Partial<IUser>;
  token: string;
}

export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly SALT_ROUNDS: number = 12;
  private readonly resendService: ResendService;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
    this.resendService = new ResendService();
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateToken(userId: Types.ObjectId | string): string {
    const userIdString = typeof userId === 'string' ? userId : userId.toString();
    
    if (!this.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }
    
    return jwt.sign(
      { userId: userIdString },
      this.JWT_SECRET as jwt.Secret,
      { expiresIn: this.JWT_EXPIRES_IN } as jwt.SignOptions
    );
  }

  generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async registerUser(userData: RegisterData): Promise<{ user: IUser; verificationToken: string }> {
    const { firstName, lastName, email, password, phone } = userData;

    // Check if user already exists
    const existingUser = await models.user.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Generate email verification token
    const verificationToken = this.generateEmailVerificationToken();

    // Create user
    const user = new models.user({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      emailVerificationToken: verificationToken,
      isEmailVerified: false,
      isActive: true,
      role: 'customer'
    });

    await user.save();

    // Send verification email
    try {
      await this.resendService.sendVerificationEmail(
        user.email,
        user.firstName,
        verificationToken
      );
      console.log('Verification email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Throw error to be handled by controller
      throw new Error(`Failed to send verification email: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
    }

    return { user, verificationToken };
  }

  async confirmEmail(token: string): Promise<IUser> {
    const user = await models.user.findOne({ 
      emailVerificationToken: token,
      isEmailVerified: false 
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    // Send welcome email after successful verification
    try {
      await this.resendService.sendWelcomeEmail(
        user.email,
        user.firstName
      );
      console.log('Welcome email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Throw error to be handled by controller
      throw new Error(`Failed to send welcome email: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
    }

    return user;
  }

  async loginUser(loginData: LoginData): Promise<AuthResponse> {
    const { email, password: inputPassword } = loginData;

    // Find user and include password for comparison
    const user = await models.user.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    }).select('+password');

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new Error('Please verify your email before logging in');
    }

    // Compare password
    const isPasswordValid = await this.comparePassword(inputPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = this.generateToken(user._id);

    // Remove password from response
    const userObj = user.toObject();
    const { password: userPassword, emailVerificationToken, passwordResetToken, passwordResetExpires, ...userResponse } = userObj;

    return {
      user: userResponse,
      token
    };
  }

  async getUserById(userId: string): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    return await models.user.findById(userId);
  }

  verifyToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}