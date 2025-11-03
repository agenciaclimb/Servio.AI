// Generate og-image.jpg from public/og-image.svg using sharp
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const src = resolve(__dirname, '../public/og-image.svg');
  const dest = resolve(__dirname, '../public/og-image.jpg');

  try {
    const svgBuffer = await readFile(src);

    // 1200x630 is the recommended OG size
    await sharp(svgBuffer)
      .resize(1200, 630, { fit: 'cover', withoutEnlargement: false })
      .flatten({ background: '#ffffff' }) // ensure non-transparent background
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(dest);

    console.log(`Created: ${dest}`);
  } catch (err) {
    console.error('Failed generating og-image.jpg:', err);
    process.exit(1);
  }
}

main();
