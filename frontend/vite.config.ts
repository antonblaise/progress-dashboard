import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'os';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        allowedHosts: [os.hostname().toLowerCase()]
    }
})
