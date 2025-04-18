// tests/modules/auth/auth.route.test.ts

// Set environment variables before importing modules
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRE = '30d';
process.env.CLIENT_URL = 'http://localhost:3001';

import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../modules/user/user.model';
import Token from '../modules/token/token.model';
import authRouter from '../modules/auth/auth.route';
import errorHandler from '../shared/middleware/error';

// Mock dependencies
jest.mock('../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

describe('Auth Routes', () => {
  let app: Express;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/v1/auth', authRouter);
    app.use(errorHandler);
  });

  // Test Register Route
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        password: 'securePassword123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email.toLowerCase());
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.message).toContain('Registration successful');
      
      // Verify user was saved in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
    });

    it('should reject registration with missing fields', async () => {
      const incompleteData = {
        first_name: 'John',
        email: 'john.incomplete@example.com'
        // Missing last_name and password
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('All fields are required');
    });

    it('should reject registration with invalid email', async () => {
      const invalidEmailData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'not-an-email',
        password: 'securePassword123'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('Invalid email format');
    });

    it('should reject registration with duplicate email', async () => {
      // Create a user first
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'duplicate@example.com',
        password: 'securePassword123'
      };
      
      await User.create(userData);
      
      // Try to register with the same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('Email already registered');
    });
  });

  // Test Login Route
  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@example.com',
        password: 'securePassword123',
        isVerified: true
      });
    });

    it('should login a user successfully and return token', async () => {
      const loginData = {
        email: 'jane.doe@example.com',
        password: 'securePassword123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeTruthy();
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token');
    });

    it('should reject login with incorrect password', async () => {
      const loginData = {
        email: 'jane.doe@example.com',
        password: 'wrongPassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'securePassword123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with invalid email format', async () => {
      const loginData = {
        email: 'not-an-email',
        password: 'securePassword123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('Invalid email format');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('Please provide an email and password');
    });
  });

  // Test Logout Route
  describe('POST /api/v1/auth/logout', () => {
    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
      expect(response.headers['set-cookie'][0]).toContain('token=;');
    });
  });

  // Test Get Current User Route
  describe('GET /api/v1/auth/me', () => {
    let token: string;
    let userId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      // Create a test user
      const user = await User.create({
        first_name: 'Current',
        last_name: 'User',
        email: 'current.user@example.com',
        password: 'securePassword123',
        isVerified: true
      });
      userId = user._id;
      
      // Generate token manually for testing
      token = jwt.sign(
        { id: userId, role: ['user'] },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      );
    });

    it('should return current user when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(userId.toString());
      expect(response.body.data.email).toBe('current.user@example.com');
      expect(response.body.data.password).toBeUndefined();
    });

    it('should accept token from cookie', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', `token=${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(userId.toString());
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('Not authorized, no token found');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken123')
        .expect(401);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('Not authorized, invalid token');
    });

    it('should reject if user no longer exists', async () => {
      // Delete the user but keep the valid token
      await User.findByIdAndDelete(userId);
      
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('User not found');
    });
  });

  // Test Forgot Password Route
  describe('POST /api/v1/auth/forgot-password', () => {
    beforeEach(async () => {
      await User.create({
        first_name: 'Reset',
        last_name: 'User',
        email: 'reset.user@example.com',
        password: 'securePassword123'
      });
    });


    it('should reject for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('User not found');
    });
  });

  // Test Reset Password Route
  describe('POST /api/v1/auth/reset-password', () => {
    let userId: mongoose.Types.ObjectId;
    let resetToken: string;

    beforeEach(async () => {
      // Create a test user
      const user = await User.create({
        first_name: 'Password',
        last_name: 'Reset',
        email: 'password.reset@example.com',
        password: 'oldPassword123'
      });
      userId = user._id;
      
      // Create a reset token
      resetToken = 'validResetToken123';
      const bcrypt = require('bcryptjs');
      const salt = 10;
      const hashedToken = await bcrypt.hash(resetToken, salt);
      
      // Save token to database
      await Token.create({
        userId: userId,
        token: hashedToken
      });
    });


    it('should reject reset with missing parameters', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .query({ token: resetToken }) // Missing ID
        .send({ password: 'newPassword123' })
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('Invalid request');
    });

    it('should reject reset with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .query({ token: 'invalidToken', id: userId.toString() })
        .send({ password: 'newPassword123' })
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('Invalid or expired token');
    });

    it('should reject reset for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .query({ token: resetToken, id: fakeId.toString() })
        .send({ password: 'newPassword123' })
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('Invalid or expired token');
    });
  });

  // Test Email Verification Route
  describe('GET /api/v1/auth/verify-email', () => {
    let userId: mongoose.Types.ObjectId;
    let verificationToken: string;

    beforeEach(async () => {
      verificationToken = 'valid-verification-token-123';
      
      // Create a test user with verification token
      const user = await User.create({
        first_name: 'Verify',
        last_name: 'User',
        email: 'verify.user@example.com',
        password: 'securePassword123',
        verificationToken,
        verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours in future
        isVerified: false
      });
      userId = user._id;
    });

    it('should verify email with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/verify-email')
        .query({ token: verificationToken, id: userId.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Email verified successfully');
      
      // Check user is now verified
      const user = await User.findById(userId);
      expect(user?.isVerified).toBe(true);
      expect(user?.verificationToken).toBeUndefined();
      expect(user?.verificationTokenExpires).toBeUndefined();
    });

    it('should reject verification with missing parameters', async () => {
      const response = await request(app)
        .get('/api/v1/auth/verify-email')
        .query({ token: verificationToken }) // Missing ID
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('Invalid verification link');
    });

    it('should reject verification for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get('/api/v1/auth/verify-email')
        .query({ token: verificationToken, id: fakeId.toString() })
        .expect(404);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('User not found');
    });

    it('should reject verification with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/verify-email')
        .query({ token: 'invalid-token', id: userId.toString() })
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('Invalid or expired token');
    });

    it('should reject verification with expired token', async () => {
      // Update user to have expired token
      await User.findByIdAndUpdate(userId, {
        verificationTokenExpires: new Date(Date.now() - 1000) // In the past
      });
      
      const response = await request(app)
        .get('/api/v1/auth/verify-email')
        .query({ token: verificationToken, id: userId.toString() })
        .expect(400);

      expect(response.body.success).toBeFalsy();
      expect(response.body.error).toContain('Invalid or expired token');
    });
  });
});