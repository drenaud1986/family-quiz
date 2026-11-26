import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Icônes générées à partir de public/icon.svg (npx pwa-assets-generator).
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.12, resizeOptions: { background: '#1a0b3d' } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#1a0b3d' } }
  },
  images: ['public/icon.svg']
});
