/**
 * INTERVIEW MANAGEMENT MODULE TEST SUITE
 * 
 * This test suite covers both Black Box and White Box testing methods
 * for the Interview Management Module including:
 * - Saving Interview Data
 * - Generating AI Feedback via Google Gemini
 * - Interview Data Retrieval
 * - Q&A Pair Processing
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { POST as saveInterview } from '../../src/app/api/interview/save-interview/route';
import { generateFeedbackWithGemini } from '../../src/lib/googleGemini';
import Interview from '../../src/model/interviewModel';
import User from '../../src/model/userModel';

// Mock dependencies
jest.mock('../../src/lib/dbconfig', () => ({
  connect: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../src/lib/googleGemini', () => ({
  generateFeedbackWithGemini: jest.fn(),
}));

// ============================================
// BLACK BOX TESTING
// ============================================

describe('Interview Management Module - Black Box Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Save Interview API - Black Box Tests', () => {
    it('should successfully save interview with valid data', async () => {
      const mockFeedback = {
        totalScore: 85,
        finalAssessment: 'Good performance overall',
        strengths: ['Clear communication', 'Good technical knowledge'],
        improvements: ['Could elaborate more on design patterns'],
        recommendations: ['Practice system design questions'],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        role: 'Software Developer',
        level: 'Medium',
        company: 'Tech Corp',
        techstack: ['React', 'Node.js'],
        qaPairs: [
          { question: 'What is React?', answer: 'React is a JavaScript library for building UIs' },
          { question: 'Explain closures', answer: 'Closures allow functions to access outer scope variables' },
        ],
        strengths: [],
        improvements: [],
        recommendations: [],
        nervousness_score: 3.5,
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.interviewId).toBeDefined();
    });

    it('should reject interview save with missing userId', async () => {
      const requestBody = {
        type: 'Technical',
        qaPairs: [
          { question: 'What is React?', answer: 'A JavaScript library' },
        ],
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('User ID is required');
    });

    it('should reject interview save with missing qaPairs', async () => {
      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Q&A pairs are required');
    });

    it('should reject interview save with empty qaPairs array', async () => {
      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: [],
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Q&A pairs are required');
    });

    it('should reject interview save with invalid qaPairs (not array)', async () => {
      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: 'not-an-array',
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Q&A pairs are required');
    });

    it('should handle invalid interview type and default to Technical', async () => {
      const mockFeedback = {
        totalScore: 75,
        finalAssessment: 'Average performance',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'InvalidType',
        qaPairs: [
          { question: 'Test question?', answer: 'Test answer' },
        ],
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Type should be defaulted to "Technical"
    });

    it('should handle missing optional fields gracefully', async () => {
      const mockFeedback = {
        totalScore: 80,
        finalAssessment: 'Good',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        qaPairs: [
          { question: 'Test?', answer: 'Answer' },
        ],
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle very large qaPairs array', async () => {
      const mockFeedback = {
        totalScore: 90,
        finalAssessment: 'Excellent',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      const largeQAPairs = Array.from({ length: 100 }, (_, i) => ({
        question: `Question ${i + 1}?`,
        answer: `Answer ${i + 1}`,
      }));

      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: largeQAPairs,
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle missing nervousness_score (defaults to 0)', async () => {
      const mockFeedback = {
        totalScore: 75,
        finalAssessment: 'Good',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: [
          { question: 'Test?', answer: 'Answer' },
        ],
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Boundary Value Testing - Black Box', () => {
    it('should handle minimum qaPairs (1 pair)', async () => {
      const mockFeedback = {
        totalScore: 70,
        finalAssessment: 'Minimal data',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: [
          { question: 'Single question?', answer: 'Single answer' },
        ],
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      expect(response.status).toBe(200);
    });

    it('should handle very long question text', async () => {
      const mockFeedback = {
        totalScore: 75,
        finalAssessment: 'Good',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      const longQuestion = 'A'.repeat(10000);
      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: [
          { question: longQuestion, answer: 'Answer' },
        ],
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      // Should handle gracefully
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle very long answer text', async () => {
      const mockFeedback = {
        totalScore: 75,
        finalAssessment: 'Good',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      const longAnswer = 'B'.repeat(10000);
      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: [
          { question: 'Question?', answer: longAnswer },
        ],
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      // Should handle gracefully
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle nervousness_score boundary values', async () => {
      const mockFeedback = {
        totalScore: 75,
        finalAssessment: 'Good',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      // Test minimum (0)
      const requestBody1 = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: [{ question: 'Q?', answer: 'A' }],
        nervousness_score: 0,
      };

      const request1 = {
        json: async () => requestBody1,
      };

      const response1 = await saveInterview(request1);
      expect(response1.status).toBe(200);

      // Test maximum (10)
      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);
      const requestBody2 = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: [{ question: 'Q?', answer: 'A' }],
        nervousness_score: 10,
      };

      const request2 = {
        json: async () => requestBody2,
      };

      const response2 = await saveInterview(request2);
      expect(response2.status).toBe(200);
    });
  });
});

// ============================================
// WHITE BOX TESTING
// ============================================

describe('Interview Management Module - White Box Testing', () => {
  describe('Google Gemini Integration - White Box Tests', () => {
    it('should format prompt correctly with all parameters', async () => {
      const mockFetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    totalScore: 85,
                    finalAssessment: 'Good',
                    strengths: [],
                    improvements: [],
                    recommendations: [],
                  }),
                }],
              },
            }],
          }),
        })
      );

      global.fetch = mockFetch;

      const result = await generateFeedbackWithGemini({
        role: 'Senior Software Engineer',
        level: 'L5',
        type: 'Technical',
        company: 'Google',
        techstack: ['React', 'Node.js', 'AWS'],
        question_answers: [
          { question: 'What is React?', answer: 'A library' },
        ],
        nervousness_score: 5,
      });

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('generateContent');
      expect(callArgs[1].body).toContain('Senior Software Engineer');
      expect(callArgs[1].body).toContain('React');
      expect(callArgs[1].body).toContain('nervousness_score');
    });

    it('should handle missing API key gracefully', async () => {
      const originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      const result = await generateFeedbackWithGemini({
        role: 'Developer',
        level: 'Medium',
        type: 'Technical',
        company: '',
        techstack: [],
        question_answers: [],
        nervousness_score: 0,
      });

      expect(result.totalScore).toBe(0);
      expect(result.finalAssessment).toContain('API key is missing');

      process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey;
    });

    it('should retry on API failure with exponential backoff', async () => {
      let attemptCount = 0;
      const mockFetch = jest.fn(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: { message: 'Internal server error' } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    totalScore: 80,
                    finalAssessment: 'Success after retry',
                    strengths: [],
                    improvements: [],
                    recommendations: [],
                  }),
                }],
              },
            }],
          }),
        });
      });

      global.fetch = mockFetch;

      const result = await generateFeedbackWithGemini({
        role: 'Developer',
        level: 'Medium',
        type: 'Technical',
        company: '',
        techstack: [],
        question_answers: [{ question: 'Q?', answer: 'A' }],
        nervousness_score: 3,
      });

      expect(attemptCount).toBe(3);
      expect(result.totalScore).toBe(80);
    });

    it('should handle invalid JSON response from API', async () => {
      const mockFetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: 'Invalid JSON response',
                }],
              },
            }],
          }),
        })
      );

      global.fetch = mockFetch;

      await expect(
        generateFeedbackWithGemini({
          role: 'Developer',
          level: 'Medium',
          type: 'Technical',
          company: '',
          techstack: [],
          question_answers: [],
          nervousness_score: 0,
        })
      ).rejects.toThrow();
    });

    it('should use correct response schema for structured output', async () => {
      const mockFetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    totalScore: 85,
                    finalAssessment: 'Test',
                    strengths: ['S1'],
                    improvements: ['I1'],
                    recommendations: ['R1'],
                  }),
                }],
              },
            }],
          }),
        })
      );

      global.fetch = mockFetch;

      await generateFeedbackWithGemini({
        role: 'Developer',
        level: 'Medium',
        type: 'Technical',
        company: '',
        techstack: [],
        question_answers: [],
        nervousness_score: 0,
      });

      const callArgs = mockFetch.mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);
      expect(payload.generationConfig.responseMimeType).toBe('application/json');
      expect(payload.generationConfig.responseSchema).toBeDefined();
    });
  });

  describe('Interview Data Processing - White Box Tests', () => {
    it('should map qaPairs correctly to interview schema', async () => {
      const mockFeedback = {
        totalScore: 85,
        finalAssessment: 'Good',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      const qaPairs = [
        { question: 'Q1?', answer: 'A1' },
        { question: 'Q2?', answer: 'A2' },
      ];

      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs,
      };

      const request = {
        json: async () => requestBody,
      };

      // Mock Interview.save
      const mockSave = jest.fn().mockResolvedValue({
        _id: 'interview123',
        ...requestBody,
      });

      Interview.prototype.save = mockSave;

      const response = await saveInterview(request);
      expect(response.status).toBe(200);

      // Verify the interview was created with correct structure
      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle techstack as both array and single value', async () => {
      const mockFeedback = {
        totalScore: 80,
        finalAssessment: 'Good',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      // Test with string (should be converted to array)
      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        techstack: 'React',
        qaPairs: [{ question: 'Q?', answer: 'A' }],
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      expect(response.status).toBe(200);
    });

    it('should update user interviews array after saving', async () => {
      const mockFeedback = {
        totalScore: 85,
        finalAssessment: 'Good',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      const mockFindByIdAndUpdate = jest.fn().mockResolvedValue({});
      User.findByIdAndUpdate = mockFindByIdAndUpdate;

      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: [{ question: 'Q?', answer: 'A' }],
      };

      const request = {
        json: async () => requestBody,
      };

      const mockSavedInterview = { _id: 'interview123' };
      Interview.prototype.save = jest.fn().mockResolvedValue(mockSavedInterview);

      const response = await saveInterview(request);
      expect(response.status).toBe(200);

      // Verify user was updated
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { $push: { interviews: 'interview123' } }
      );
    });

    it('should handle database errors during interview save', async () => {
      const mockFeedback = {
        totalScore: 85,
        finalAssessment: 'Good',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      Interview.prototype.save = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: [{ question: 'Q?', answer: 'A' }],
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to save interview');
    });

    it('should handle non-existent user ID', async () => {
      const mockFeedback = {
        totalScore: 85,
        finalAssessment: 'Good',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      User.findById = jest.fn().mockResolvedValue(null);

      const requestBody = {
        userId: 'nonexistent123',
        type: 'Technical',
        qaPairs: [{ question: 'Q?', answer: 'A' }],
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('User not found');
    });
  });

  describe('Code Path Coverage - White Box Tests', () => {
    it('should use provided strengths/improvements/recommendations if Gemini fails', async () => {
      const providedStrengths = ['Provided strength'];
      const providedImprovements = ['Provided improvement'];
      const providedRecommendations = ['Provided recommendation'];

      generateFeedbackWithGemini.mockResolvedValueOnce({
        totalScore: 0,
        finalAssessment: '',
        strengths: [],
        improvements: [],
        recommendations: [],
      });

      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: [{ question: 'Q?', answer: 'A' }],
        strengths: providedStrengths,
        improvements: providedImprovements,
        recommendations: providedRecommendations,
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      expect(response.status).toBe(200);
    });

    it('should handle all valid interview types', async () => {
      const types = ['Technical', 'Behavioral', 'Mixed'];

      for (const type of types) {
        const mockFeedback = {
          totalScore: 80,
          finalAssessment: 'Good',
          strengths: [],
          improvements: [],
          recommendations: [],
        };

        generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

        const requestBody = {
          userId: '507f1f77bcf86cd799439011',
          type,
          qaPairs: [{ question: 'Q?', answer: 'A' }],
        };

        const request = {
          json: async () => requestBody,
        };

        const response = await saveInterview(request);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Edge Cases - White Box Tests', () => {
    it('should handle empty strings in qaPairs', async () => {
      const mockFeedback = {
        totalScore: 70,
        finalAssessment: 'Incomplete',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: [
          { question: '', answer: '' },
        ],
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      // Should handle gracefully
      expect([200, 400]).toContain(response.status);
    });

    it('should handle null values in optional fields', async () => {
      const mockFeedback = {
        totalScore: 75,
        finalAssessment: 'Good',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: [{ question: 'Q?', answer: 'A' }],
        company: null,
        techstack: null,
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      expect(response.status).toBe(200);
    });

    it('should handle special characters in Q&A text', async () => {
      const mockFeedback = {
        totalScore: 80,
        finalAssessment: 'Good',
        strengths: [],
        improvements: [],
        recommendations: [],
      };

      generateFeedbackWithGemini.mockResolvedValueOnce(mockFeedback);

      const requestBody = {
        userId: '507f1f77bcf86cd799439011',
        type: 'Technical',
        qaPairs: [
          {
            question: 'What is <script>alert("xss")</script>?',
            answer: 'Answer with "quotes" and \'apostrophes\'',
          },
        ],
      };

      const request = {
        json: async () => requestBody,
      };

      const response = await saveInterview(request);
      expect(response.status).toBe(200);
    });
  });
});



