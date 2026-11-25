import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Chemins relatifs : l'application fonctionne aussi dans un sous-dossier (GitHub Pages).
  base: './',
  // La banque de 1000 questions est incluse dans le code : le paquet dépasse 500 Ko, c'est voulu.
  build: { chunkSizeWarningLimit: 1200 },
  plugins: [
    svelte({
      // Les écrans sont recréés à chaque étape : lire la valeur initiale d'une prop est voulu.
      compilerOptions: { warningFilter: (w) => w.code !== 'state_referenced_locally' }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Family Quiz',
        short_name: 'Family Quiz',
        description: 'Le jeu télévisé de la famille, sur une tablette.',
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'fullscreen',
        orientation: 'portrait',
        background_color: '#1a0b3d',
        theme_color: '#1a0b3d',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Tout est mis en cache : le jeu fonctionne entièrement hors ligne.
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,json}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ]
});
