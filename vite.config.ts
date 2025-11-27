import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { compression, defineAlgorithm } from 'vite-plugin-compression2';

const gzip = defineAlgorithm('gzip', { level: 9 });
const brotli = defineAlgorithm('brotliCompress', { level: 11 });

export default defineConfig({
    plugins: [
        react(),
        compression({
            algorithms: [gzip, brotli],
        }),
    ],
    server: {
        port: 5173,
        fs: {
            // Allow serving files from the data/countries submodule
            allow: ['..'],
        },
    },
    publicDir: 'public',
    base: '',
});
