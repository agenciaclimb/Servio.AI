import { vi } from 'vitest';
import path from 'path';

// Global Mocks for Legacy CJS Modules
vi.mock('firebase-functions', () => {
    return {
        config: () => ({ env: 'test', service: { account_sid: 'AC123', auth_token: 'auth123', phone_number: '+1234567890' } }),
        logger: {
            info: () => {},
            error: () => {},
            warn: () => {},
            log: () => {},
        },
        https: {
            onRequest: (fn) => fn,
            onCall: (fn) => fn,
        },
    };
});

vi.mock('@google-cloud/secret-manager', () => {
    return {
        SecretManagerServiceClient: class {
            async accessSecretVersion() {
                return [{ payload: { data: Buffer.from('mock-secret') } }];
            }
        }
    };
});
vi.mock('firebase-admin', () => {
    // Import from local file that mimics the structure required by CJS
    // Note: in setup.js (ESM), we need to use 'default' if the mock exports generic object
    const mockAdmin = require('./mocks/firebase-admin.js');
    return {
        default: mockAdmin,
        ...mockAdmin,
    };
});
vi.mock('../src/middleware/auth.js', () => ({
    requireAuth: (req, res, next) => {
        req.user = {
            email: 'prospector@test.com',
            isAdmin: false,
        };
        next();
    },
}));
