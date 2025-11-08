import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/index.js';

// Fake storage that returns a deterministic signed URL without requiring GCP
const fakeStorage = {
	bucket: (_name?: string) => ({
		file: (_path: string) => ({
			// Mimic the signature of @google-cloud/storage
			getSignedUrl: async (_options: any) => ['https://fake-signed-url.example.com/upload'],
		}),
	}),
};

describe('File uploads - generate signed URL', () => {
	let originalBucketEnv: string | undefined;

	beforeEach(() => {
		originalBucketEnv = process.env.GCP_STORAGE_BUCKET;
	});

	afterEach(() => {
		if (originalBucketEnv !== undefined) {
			process.env.GCP_STORAGE_BUCKET = originalBucketEnv;
		} else {
			delete process.env.GCP_STORAGE_BUCKET;
		}
	});

	it('returns 400 when missing parameters', async () => {
		const app = createApp({ storage: fakeStorage as any });
		const res = await request(app).post('/generate-upload-url').send({});
		expect(res.status).toBe(400);
		expect(res.body).toHaveProperty('error');
	});

	it('returns 500 when bucket env missing', async () => {
		// Ensure env var is absent
		delete process.env.GCP_STORAGE_BUCKET;
		const app = createApp({ storage: fakeStorage as any });

		const res = await request(app)
			.post('/generate-upload-url')
			.send({ fileName: 'photo.png', contentType: 'image/png', jobId: 'job123' });

		expect(res.status).toBe(500);
		expect(res.body).toHaveProperty('error');
	});

	it('returns signed URL when parameters are valid', async () => {
		// Provide a dummy bucket name so the route passes env check
		process.env.GCP_STORAGE_BUCKET = process.env.GCP_STORAGE_BUCKET || 'test-bucket';

		const app = createApp({ storage: fakeStorage as any });
		const res = await request(app)
			.post('/generate-upload-url')
			.send({ fileName: 'photo.png', contentType: 'image/png', jobId: 'job123' });

		expect(res.status).toBe(200);
		expect(res.headers['content-type']).toContain('application/json');
		expect(res.body).toHaveProperty('signedUrl');
		expect(res.body.signedUrl).toContain('fake-signed-url');
		expect(res.body).toHaveProperty('filePath');
		expect(res.body.filePath).toContain('jobs/job123/');
	});
});
