import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// 参考: docs/protocol と docs/kit 等の情報源は各 repo の docs/ を
// scripts/fetch-docs.mjs で src/content/docs/docs/ に取り込んでから build する。

export default defineConfig({
  site: 'https://devtools.hapbeat.com',
  server: {
    // hapbeat-studio が Vite default の 5173 を使うため衝突を避けて 1313 に固定。
    // 1313 は Hugo docs site の慣例ポートで覚えやすい。
    port: 1313,
  },
  integrations: [
    starlight({
      title: 'Hapbeat devtools',
      description: '触覚デバイス Hapbeat のクリエイター・開発者向けツールとドキュメント',
      defaultLocale: 'ja',
      locales: {
        ja: { label: '日本語', lang: 'ja' },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Hapbeat' },
      ],
      sidebar: [
        {
          label: 'はじめに',
          items: [
            { label: 'Getting Started', link: '/docs/getting-started/' },
            { label: 'アーキテクチャと主要概念', link: '/docs/concepts/' },
          ],
        },
        // 各 repo の docs/ は scripts/fetch-docs.mjs が build 時に
        //   src/content/docs/docs/_fetched/<short>/ に集約する。
        // autogenerate でそのディレクトリ配下を自動でサイドバー化する。
        {
          label: 'Hapbeat Manager',
          autogenerate: { directory: 'docs/_fetched/manager' },
        },
        {
          label: 'Hapbeat Studio',
          autogenerate: { directory: 'docs/_fetched/studio' },
        },
        {
          label: 'Unity SDK',
          autogenerate: { directory: 'docs/_fetched/unity-sdk' },
        },
        {
          label: 'Unreal SDK',
          badge: { text: 'WIP', variant: 'caution' },
          autogenerate: { directory: 'docs/_fetched/unreal-sdk' },
        },
        {
          label: 'Creative Kit',
          badge: { text: 'WIP', variant: 'caution' },
          autogenerate: { directory: 'docs/_fetched/creative-kit' },
        },
        {
          label: 'Device Firmware',
          autogenerate: { directory: 'docs/_fetched/firmware' },
        },
        {
          label: 'Kit Tools (CLI)',
          autogenerate: { directory: 'docs/_fetched/kit-tools' },
        },
        {
          label: 'Contracts (仕様)',
          autogenerate: { directory: 'docs/_fetched/contracts' },
        },
        {
          label: 'その他',
          items: [
            { label: 'Downloads', link: '/downloads/' },
            { label: 'Showcase', link: '/showcase/', badge: { text: 'WIP', variant: 'caution' } },
            { label: 'FAQ', link: '/faq/' },
            { label: 'Changelog', link: '/changelog/' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
});
