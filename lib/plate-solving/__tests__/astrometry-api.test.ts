/**
 * Tests for astrometry-api.ts
 */

import { AstrometryApiClient } from '../astrometry-api';
import { createErrorResult } from '../types';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL/revokeObjectURL for getImageDimensions
global.URL.createObjectURL = jest.fn(() => 'blob:mock');
global.URL.revokeObjectURL = jest.fn();

describe('AstrometryApiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should create client with required config', () => {
      const client = new AstrometryApiClient({ apiKey: 'test-key' });
      expect(client).toBeDefined();
    });

    it('should use default baseUrl if not provided', () => {
      const client = new AstrometryApiClient({ apiKey: 'test-key' });
      expect(client).toBeDefined();
    });

    it('should use custom baseUrl if provided', () => {
      const client = new AstrometryApiClient({
        apiKey: 'test-key',
        baseUrl: 'https://custom.astrometry.net',
      });
      expect(client).toBeDefined();
    });

    it('should use custom timeout if provided', () => {
      const client = new AstrometryApiClient({
        apiKey: 'test-key',
        timeout: 60000,
      });
      expect(client).toBeDefined();
    });

    it('should use custom pollInterval if provided', () => {
      const client = new AstrometryApiClient({
        apiKey: 'test-key',
        pollInterval: 10000,
      });
      expect(client).toBeDefined();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success', session: 'test-session' }),
      });

      const client = new AstrometryApiClient({ apiKey: 'test-key' });
      const session = await client.login();
      
      expect(session.sessionKey).toBe('test-session');
    });

    it('should throw error on login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'error', message: 'Invalid API key' }),
      });

      const client = new AstrometryApiClient({ apiKey: 'invalid-key' });
      
      await expect(client.login()).rejects.toThrow('Invalid API key');
    });
  });

  describe('cancel', () => {
    it('should cancel ongoing operations', () => {
      const client = new AstrometryApiClient({ apiKey: 'test-key' });
      expect(() => client.cancel()).not.toThrow();
    });
  });

  describe('HTTP status checks', () => {
    let client: AstrometryApiClient;

    beforeEach(() => {
      client = new AstrometryApiClient({ apiKey: 'test-key' });
    });

    it('should throw on non-ok getSubmissionStatus', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(client.getSubmissionStatus(123)).rejects.toThrow('HTTP 500');
    });

    it('should throw on non-ok getJobStatus', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(client.getJobStatus(456)).rejects.toThrow('HTTP 404');
    });

    it('should throw on non-ok getCalibration', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 502 });
      await expect(client.getCalibration(789)).rejects.toThrow('HTTP 502');
    });

    it('should throw on non-ok getObjectsInField', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
      await expect(client.getObjectsInField(111)).rejects.toThrow('HTTP 503');
    });

    it('should throw on non-ok getAnnotations', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });
      await expect(client.getAnnotations(222)).rejects.toThrow('HTTP 403');
    });

    it('should return data on successful getSubmissionStatus', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobs: [1], job_calibrations: [] }),
      });
      const result = await client.getSubmissionStatus(123);
      expect(result.jobs).toEqual([1]);
    });

    it('should return data on successful getJobStatus', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success' }),
      });
      const result = await client.getJobStatus(456);
      expect(result.status).toBe('success');
    });
  });

  describe('createErrorResult', () => {
    it('should create a standard error result', () => {
      const result = createErrorResult('test-solver', 'Something went wrong');
      expect(result.success).toBe(false);
      expect(result.solverName).toBe('test-solver');
      expect(result.errorMessage).toBe('Something went wrong');
      expect(result.coordinates).toBeNull();
      expect(result.positionAngle).toBe(0);
      expect(result.pixelScale).toBe(0);
      expect(result.fov).toEqual({ width: 0, height: 0 });
      expect(result.solveTime).toBe(0);
    });
  });

  describe('solve flow', () => {
    it('should return error result on upload failure', async () => {
      // Login succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success', session: 'sess' }),
      });
      // Upload fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const client = new AstrometryApiClient({
        apiKey: 'test-key',
        timeout: 5000,
        pollInterval: 100,
      });
      const mockBlob = new Blob(['fake-image'], { type: 'image/jpeg' });
      const result = await client.solve(mockBlob);
      
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Network error');
      expect(result.solverName).toBe('astrometry.net');
    });

    it('should call onProgress with stages', async () => {
      const onProgress = jest.fn();
      // Login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success', session: 'sess' }),
      });
      // Upload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success', subid: 1001 }),
      });
      // Submission status (returns job)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobs: [2001], job_calibrations: [] }),
      });
      // Job status (success)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success' }),
      });
      // Calibration
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ra: 180.5, dec: -30.2, orientation: 45.0,
          pixscale: 1.2, radius: 0.5, parity: 1,
        }),
      });
      // Objects in field
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ objects_in_field: ['NGC 1234'] }),
      });

      const client = new AstrometryApiClient({
        apiKey: 'test-key',
        timeout: 60000,
        pollInterval: 10,
      });
      const mockBlob = new Blob(['fake-image'], { type: 'image/jpeg' });
      const result = await client.solve(mockBlob, {}, onProgress);
      
      expect(result.success).toBe(true);
      expect(result.coordinates?.ra).toBeCloseTo(180.5);
      expect(result.coordinates?.dec).toBeCloseTo(-30.2);
      expect(result.positionAngle).toBeCloseTo(45.0);
      expect(result.pixelScale).toBeCloseTo(1.2);
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ stage: 'uploading' }));
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ stage: 'queued' }));
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ stage: 'processing' }));
      expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ stage: 'success' }));
    });

    it('should return error on solve failure status', async () => {
      // Login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success', session: 'sess' }),
      });
      // Upload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success', subid: 1001 }),
      });
      // Submission status
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobs: [2001], job_calibrations: [] }),
      });
      // Job status (failure)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'failure' }),
      });

      const client = new AstrometryApiClient({
        apiKey: 'test-key',
        timeout: 60000,
        pollInterval: 10,
      });
      const mockBlob = new Blob(['fake-image'], { type: 'image/jpeg' });
      const result = await client.solve(mockBlob);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Plate solving failed');
    });

    it('should timeout when waiting too long for job', async () => {
      // Login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success', session: 'sess' }),
      });
      // Upload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success', subid: 1001 }),
      });
      // Submission status — never returns jobs
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ jobs: [], job_calibrations: [] }),
      });

      const client = new AstrometryApiClient({
        apiKey: 'test-key',
        timeout: 200,
        pollInterval: 50,
      });
      const mockBlob = new Blob(['fake-image'], { type: 'image/jpeg' });
      const result = await client.solve(mockBlob);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Timeout');
    });
  });
});
