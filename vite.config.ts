/// <reference types="node" />
import { defineConfig } from 'vite';

// GitHub Pages project name, used for the https://username.github.io/<repo>/ path.
const REPO_NAME = 'dropimals';

// Two build targets:
//   npm run build             → GitHub Pages  (base '/dropimals/', out 'dist')
//   npm run build:crazygames  → CrazyGames    (relative './' paths, out 'dist-crazygames')
// CrazyGames serves games from its own sub-path and requires relative asset
// URLs, so we emit base './' there instead of an absolute path.
export default defineConfig(({ mode }) => {
  const isCrazyGames = mode === 'crazygames';
  return {
    base: isCrazyGames ? './' : mode === 'production' ? `/${REPO_NAME}/` : '/',
    build: {
      outDir: isCrazyGames ? 'dist-crazygames' : 'dist',
      target: 'es2020',
    },
  };
});
