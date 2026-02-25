import type { NextConfig } from 'next';
import path from 'path';
import dotenv from 'dotenv';

// Load root .env so NEXT_PUBLIC_* vars are available to the client bundle
dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });

const nextConfig: NextConfig = {
  transpilePackages: ['@assemblr/shared'],
};

export default nextConfig;
