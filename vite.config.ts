/// <reference types="node" />
import { defineConfig } from 'vite';

// Set this to your GitHub repository name (e.g. 'dropimals')
// for a project page at https://username.github.io/dropimals/
// Use '/' if deploying to a custom domain or a user/org page.
const REPO_NAME = 'dropimals';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? `/${REPO_NAME}/` : '/',
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
});
