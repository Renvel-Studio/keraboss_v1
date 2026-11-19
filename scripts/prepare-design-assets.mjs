import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
await mkdir(new URL('src/assets-compressed/images/', root), { recursive: true });
await sharp(new URL('src/assets/images/keraboss-super-k-varkiza.jpg', root).pathname)
  .webp({ quality: 85 })
  .toFile(new URL('src/assets-compressed/images/keraboss-super-k-varkiza.webp', root).pathname);
console.log('Prepared the official Super K photograph for responsive image generation.');
