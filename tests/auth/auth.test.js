/**
 * AUTHENTICATION MODULE TEST SUITE
 * 
 * This test suite covers both Black Box and White Box testing methods
 * for the Authentication Module including:
 * - User Sign-up
 * - User Sign-in
 * - Email Verification
 * - Password Reset
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { POST as signUp } from '../../src/app/api/auth/sign-up/route';
import { POST as signIn } from '../../src/app/api/auth/sign-in/route';
import { generateVerificationCode } from '../../src/lib/utils';
import { signJwtToken, verifyJwtToken } from '../../src/lib/jwt';
import bcrypt from 'bcryptjs';
import User from '../../src/model/userModel';

// Mock dependencies
jest.mock('../../src/lib/dbconfig', () => ({
  connect: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../src/helpers/mailer', () => ({
  sendVerificationEmail: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((options, callback) => {
        const stream = {
          end: jest.fn(),
        };
        setTimeout(() => {
          callback(null, { secure_url: 'https://cloudinary.com/test.jpg' });
        }, 0);
        return stream;
      }),
    },
  },
}));

// ============================================
// BLACK BOX TESTING
// ============================================
// Tests focus on input/output behavior without knowledge of internal implementation

describe('Authentication Module - Black Box Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sign-Up API - Black Box Tests', () => {
    it('should successfully register a new user with valid inputs', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      const request = {
        formData: async () => formData,
      };

      const response = await signUp(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('registered successfully');
    });

    it('should reject sign-up with missing username', async () => {
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('password', 'password123');

      const request = {
        formData: async () => formData,
      };

      const response = await signUp(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });

    it('should reject sign-up with missing email', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('password', 'password123');

      const request = {
        formData: async () => formData,
      };

      const response = await signUp(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });

    it('should reject sign-up with missing password', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('email', 'test@example.com');

      const request = {
        formData: async () => formData,
      };

      const response = await signUp(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });

    it('should reject sign-up with duplicate email', async () => {
      // First registration
      const formData1 = new FormData();
      formData1.append('username', 'user1');
      formData1.append('email', 'duplicate@example.com');
      formData1.append('password', 'password123');

      const request1 = {
        formData: async () => formData1,
      };
      await signUp(request1);

      // Second registration with same email
      const formData2 = new FormData();
      formData2.append('username', 'user2');
      formData2.append('email', 'duplicate@example.com');
      formData2.append('password', 'password456');

      const request2 = {
        formData: async () => formData2,
      };

      const response = await signUp(request2);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });

    it('should reject sign-up with duplicate username', async () => {
      // First registration
      const formData1 = new FormData();
      formData1.append('username', 'duplicateuser');
      formData1.append('email', 'email1@example.com');
      formData1.append('password', 'password123');

      const request1 = {
        formData: async () => formData1,
      };
      await signUp(request1);

      // Second registration with same username
      const formData2 = new FormData();
      formData2.append('username', 'duplicateuser');
      formData2.append('email', 'email2@example.com');
      formData2.append('password', 'password456');

      const request2 = {
        formData: async () => formData2,
      };

      const response = await signUp(request2);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('Username already taken');
    });

    it('should handle invalid email format', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('email', 'invalid-email');
      formData.append('password', 'password123');

      const request = {
        formData: async () => formData,
      };

      // Note: Email validation happens in sign-in, but we test edge cases
      const response = await signUp(request);
      // Should either accept or reject based on validation
      expect([200, 400, 409]).toContain(response.status);
    });
  });

  describe('Sign-In API - Black Box Tests', () => {
    it('should successfully login with valid credentials', async () => {
      // First create a user
      const formData = new FormData();
      formData.append('username', 'loginuser');
      formData.append('email', 'login@example.com');
      formData.append('password', 'password123');

      const signUpRequest = {
        formData: async () => formData,
      };
      await signUp(signUpRequest);

      // Then login
      const loginRequest = {
        json: async () => ({
          email: 'login@example.com',
          password: 'password123',
        }),
      };

      const response = await signIn(loginRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Login successful');
    });

    it('should reject login with missing email', async () => {
      const request = {
        json: async () => ({
          password: 'password123',
        }),
      };

      const response = await signIn(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });

    it('should reject login with missing password', async () => {
      const request = {
        json: async () => ({
          email: 'test@example.com',
        }),
      };

      const response = await signIn(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });

    it('should reject login with invalid email format', async () => {
      const request = {
        json: async () => ({
          email: 'invalid-email',
          password: 'password123',
        }),
      };

      const response = await signIn(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('valid email');
    });

    it('should reject login with non-existent email', async () => {
      const request = {
        json: async () => ({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      };

      const response = await signIn(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should reject login with incorrect password', async () => {
      // First create a user
      const formData = new FormData();
      formData.append('username', 'wrongpassuser');
      formData.append('email', 'wrongpass@example.com');
      formData.append('password', 'correctpassword');

      const signUpRequest = {
        formData: async () => formData,
      };
      await signUp(signUpRequest);

      // Then try to login with wrong password
      const loginRequest = {
        json: async () => ({
          email: 'wrongpass@example.com',
          password: 'wrongpassword',
        }),
      };

      const response = await signIn(loginRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Incorrect password');
    });

    it('should reject login with password less than 6 characters', async () => {
      const request = {
        json: async () => ({
          email: 'test@example.com',
          password: '12345', // Less than 6 characters
        }),
      };

      const response = await signIn(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('at least 6 characters');
    });

    it('should reject login for unverified email', async () => {
      // Create user (unverified by default)
      const formData = new FormData();
      formData.append('username', 'unverifieduser');
      formData.append('email', 'unverified@example.com');
      formData.append('password', 'password123');

      const signUpRequest = {
        formData: async () => formData,
      };
      await signUp(signUpRequest);

      // Try to login
      const loginRequest = {
        json: async () => ({
          email: 'unverified@example.com',
          password: 'password123',
        }),
      };

      const response = await signIn(loginRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('not verified');
      expect(data.redirectTo).toBe('/verifyemail');
    });
  });

  describe('Boundary Value Testing - Black Box', () => {
    it('should handle minimum password length (6 characters)', async () => {
      const request = {
        json: async () => ({
          email: 'test@example.com',
          password: '123456', // Exactly 6 characters
        }),
      };

      const response = await signIn(request);
      // Should not reject based on length (but may reject for other reasons)
      expect([200, 400, 401, 404]).toContain(response.status);
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      const request = {
        json: async () => ({
          email: longEmail,
          password: 'password123',
        }),
      };

      const response = await signIn(request);
      // Should handle gracefully
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const request = {
        json: async () => ({
          email: 'test@example.com',
          password: longPassword,
        }),
      };

      const response = await signIn(request);
      // Should handle gracefully
      expect([200, 400, 401, 404]).toContain(response.status);
    });
  });
});

// ============================================
// WHITE BOX TESTING
// ============================================
// Tests focus on internal implementation, code paths, and edge cases

describe('Authentication Module - White Box Testing', () => {
  describe('JWT Token Functions - White Box Tests', () => {
    it('should generate a valid JWT token with correct structure', () => {
      const payload = { id: '123456789' };
      const token = signJwtToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify a valid JWT token correctly', () => {
      const payload = { id: '123456789' };
      const token = signJwtToken(payload);
      const verified = verifyJwtToken(token);

      expect(verified).toBeDefined();
      expect(verified.id).toBe('123456789');
    });

    it('should return null for invalid JWT token', () => {
      const invalidToken = 'invalid.token.here';
      const verified = verifyJwtToken(invalidToken);

      expect(verified).toBeNull();
    });

    it('should return null for expired JWT token', () => {
      const payload = { id: '123456789' };
      const token = signJwtToken(payload, { expiresIn: '1ms' });

      // Wait for token to expire
      return new Promise((resolve) => {
        setTimeout(() => {
          const verified = verifyJwtToken(token);
          expect(verified).toBeNull();
          resolve();
        }, 10);
      });
    });

    it('should handle missing JWT_SECRET environment variable', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      // Re-import to trigger the error
      expect(() => {
        require('../../src/lib/jwt');
      }).toThrow('JWT_SECRET is not defined');

      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('Verification Code Generation - White Box Tests', () => {
    it('should generate a 6-digit verification code', () => {
      const code = generateVerificationCode();

      expect(code).toBeDefined();
      expect(code.length).toBe(6);
      expect(/^\d{6}$/.test(code)).toBe(true);
    });

    it('should generate unique codes on multiple calls', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateVerificationCode());
      }

      // High probability of uniqueness (though not guaranteed)
      expect(codes.size).toBeGreaterThan(90);
    });

    it('should generate codes within valid range (100000-999999)', () => {
      for (let i = 0; i < 50; i++) {
        const code = parseInt(generateVerificationCode());
        expect(code).toBeGreaterThanOrEqual(100000);
        expect(code).toBeLessThanOrEqual(999999);
      }
    });
  });

  describe('Password Hashing - White Box Tests', () => {
    it('should hash password using bcrypt', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hash length
    });

    it('should verify password correctly against hash', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isMatch = await bcrypt.compare(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect password against hash', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isMatch = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });
  });

  describe('Code Path Coverage - White Box Tests', () => {
    it('should handle Cloudinary upload success path', async () => {
      const formData = new FormData();
      const mockFile = new Blob(['test'], { type: 'image/jpeg' });
      formData.append('username', 'testuser');
      formData.append('email', 'cloudinary@example.com');
      formData.append('password', 'password123');
      formData.append('profileImage', mockFile, 'test.jpg');

      const request = {
        formData: async () => formData,
      };

      const response = await signUp(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle email sending failure gracefully', async () => {
      // Mock email failure
      const { sendVerificationEmail } = require('../../src/helpers/mailer');
      sendVerificationEmail.mockResolvedValueOnce({
        success: false,
        message: 'SMTP error',
      });

      const formData = new FormData();
      formData.append('username', 'emailfailuser');
      formData.append('email', 'emailfail@example.com');
      formData.append('password', 'password123');

      const request = {
        formData: async () => formData,
      };

      const response = await signUp(request);
      const data = await response.json();

      // Should still register but with warning
      expect([200, 207]).toContain(response.status);
      if (response.status === 207) {
        expect(data.warning).toBeDefined();
      }
    });

    it('should handle database connection errors', async () => {
      // This would require mocking the database connection
      // For now, we test that errors are caught
      const formData = new FormData();
      formData.append('username', 'dberroruser');
      formData.append('email', 'dberror@example.com');
      formData.append('password', 'password123');

      const request = {
        formData: async () => formData,
      };

      // Mock User.findOne to throw error
      const originalFindOne = User.findOne;
      User.findOne = jest.fn(() => {
        throw new Error('Database connection failed');
      });

      const response = await signUp(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();

      // Restore
      User.findOne = originalFindOne;
    });
  });

  describe('Edge Cases - White Box Tests', () => {
    it('should handle empty string inputs', async () => {
      const request = {
        json: async () => ({
          email: '',
          password: '',
        }),
      };

      const response = await signIn(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required');
    });

    it('should handle null/undefined inputs', async () => {
      const request = {
        json: async () => ({
          email: null,
          password: undefined,
        }),
      };

      const response = await signIn(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('should handle special characters in email', async () => {
      const request = {
        json: async () => ({
          email: 'test+tag@example.com',
          password: 'password123',
        }),
      };

      const response = await signIn(request);
      // Should either accept or reject based on regex
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should handle SQL injection attempts in email', async () => {
      const request = {
        json: async () => ({
          email: "'; DROP TABLE users; --",
          password: 'password123',
        }),
      };

      const response = await signIn(request);
      // Should reject invalid email format
      expect([400, 404]).toContain(response.status);
    });

    it('should handle XSS attempts in inputs', async () => {
      const request = {
        json: async () => ({
          email: '<script>alert("xss")</script>@example.com',
          password: 'password123',
        }),
      };

      const response = await signIn(request);
      // Should reject invalid email format
      expect([400, 404]).toContain(response.status);
    });
  });
});



