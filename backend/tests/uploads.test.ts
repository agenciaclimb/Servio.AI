import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';

function makeStorageMock(url: string) {
  return {
    bucket: vi.fn().mockReturnValue({
      file: vi.fn().mockReturnValue({
        getSignedUrl: vi.fn().mockResolvedValue([url]),
      }),
    }),
  } as any;
}

describe('File uploads - generate signed URL', () => {
  let app: any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GCP_STORAGE_BUCKET = 'test-bucket';
  });

  it('returns signed URL when parameters are valid', async () => {
    const storage = makeStorageMock('https://signed.url/test');
    app = createApp({ storage });

    const res = await request(app)
      .post('/generate-upload-url')
      .send({ fileName: 'photo.png', contentType: 'image/png', jobId: 'job123' });

    expect(res.status).toBe(200);
    expect(res.body.signedUrl).toContain('https://signed.url');
    expect(res.body.filePath).toMatch(/^jobs\/job123\//);
  });

  it('returns 400 when missing parameters', async () => {
    const storage = makeStorageMock('https://signed.url/test');
    app = createApp({ storage });

    const res = await request(app)
      .post('/generate-upload-url')
      .send({ fileName: 'a.txt' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/fileName, contentType, and jobId are required\./i);
  });

  it('returns 500 when bucket env missing', async () => {
    delete process.env.GCP_STORAGE_BUCKET;
    const storage = makeStorageMock('https://signed.url/test');
    app = createApp({ storage });

    const res = await request(app)
      .post('/generate-upload-url')
      .send({ fileName: 'photo.png', contentType: 'image/png', jobId: 'job123' });

    expect(res.status).toBe(500);
  });
});
