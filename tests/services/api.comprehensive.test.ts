import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as api from '../../services/api';

vi.mock('../../mockData', () => ({
    MOCK_USERS: [{ email: 'user1@test.com', type: 'cliente', verificationStatus: 'verificado' }],
    MOCK_JOBS: [{ id: 'job1', status: 'ativo' }],
}));

describe('API Service Comprehensive Tests', () => {
    let apiCallSpy;

    beforeEach(() => {
        // Spy moved inside beforeEach to ensure a fresh spy for each test
        apiCallSpy = vi.spyOn(api, 'apiCall').mockRejectedValue(new Error('Simulated API Failure'));
    });

    afterEach(() => {
        // Clear all mocks to avoid test cross-contamination
        vi.clearAllMocks();
    });

    describe('Data Fetching with Mock Fallback', () => {
        it('fetchAllUsers should fall back to MOCK_USERS on API failure', async () => {
            const result = await api.fetchAllUsers();
            // Verifies that the fallback to mock data works when the API call fails
            expect(result).toEqual(expect.any(Array));
            expect(result.length).toBeGreaterThan(0);
        });

        it('fetchJobs should fall back to MOCK_JOBS on API failure', async () => {
            const result = await api.fetchJobs();
            expect(result).toEqual(expect.any(Array));
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('Data Creation and Updates', () => {
        it('createUser should throw an error on backend failure', async () => {
            const newUser = { email: 'new@test.com', name: 'New User', type: 'cliente' as const, bio: '' };
            await expect(api.createUser(newUser)).rejects.toThrow('Simulated API Failure');
            expect(apiCallSpy).toHaveBeenCalledWith('/users', expect.objectContaining({ method: 'POST' }));
        });
    });
});