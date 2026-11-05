import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/operaciones/supervisoria/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'redirect-dev-base',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const rawUrl = req.url || '';
          const [pathname, search] = rawUrl.split('?');
          const query = search ? `?${search}` : '';

          if (pathname === '/operaciones/supervisoria') {
            res.writeHead(301, { Location: `/operaciones/supervisoria/${query}` });
            res.end();
            return;
          }
          if (pathname === '/' || pathname === '') {
            res.writeHead(302, { Location: `/operaciones/supervisoria/${query}` });
            res.end();
            return;
          }
          if (pathname === '/favicon.ico') {
            res.writeHead(302, { Location: '/operaciones/supervisoria/favicon.ico' });
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
})
