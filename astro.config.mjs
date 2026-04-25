import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// 参考: docs/protocol と docs/kit 等の情報源は各 repo の docs/ を
// scripts/fetch-docs.mjs で src/content/docs/docs/ に取り込んでから build する。

export default defineConfig({
  site: 'https://devtools.hapbeat.com',
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
        {
          label: 'ツール',
          items: [
            { label: 'Hapbeat Manager', link: '/docs/manager/' },
            { label: 'Hapbeat Studio', link: '/docs/studio/' },
          ],
        },
        {
          label: 'SDK',
          items: [
            { label: 'Unity SDK', link: '/docs/unity-sdk/' },
            { label: 'Unreal SDK', link: '/docs/unreal-sdk/', badge: { text: 'WIP', variant: 'caution' } },
            { label: 'Creative Kit', link: '/docs/creative-kit/', badge: { text: 'WIP', variant: 'caution' } },
          ],
        },
        {
          label: 'デバイスと仕様',
          items: [
            { label: 'Device Firmware', link: '/docs/firmware/' },
            { label: 'Kit フォーマット', link: '/docs/kit/' },
            { label: 'Protocol リファレンス', link: '/docs/protocol/' },
          ],
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
