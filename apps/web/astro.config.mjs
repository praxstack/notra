// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.usenotra.com',
  output: "server",
  integrations: [
    mdx(),
    sitemap({
      changefreq: 'daily',
      priority: 1,
      lastmod: new Date(),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: vercel(),
});