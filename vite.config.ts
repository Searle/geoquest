import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { compression, defineAlgorithm } from 'vite-plugin-compression2';
import * as zlib from 'zlib';

const gzip = defineAlgorithm('gzip', { level: 9 });
const brotli = defineAlgorithm('brotliCompress', {
    params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
    },
});

export default defineConfig({
    plugins: [
        react(),
        vanillaExtractPlugin({
            identifiers: 'debug',
        }),
        compression({
            algorithms: [gzip, brotli],
        }),
    ],
    server: {
        port: 5173,
        fs: {
            // Allow serving files from ../data/
            allow: ['..'],
        },
    },
    publicDir: 'public',
    base: '/geoquest/',
});
