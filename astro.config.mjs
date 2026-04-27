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
      // Google Fonts を <head> に注入 (design tokens の font-family と一致させる)。
      // Inter (英) + Noto Sans JP (日) + JetBrains Mono (code)。
      head: [
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'true' } },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
          },
        },
      ],
      // Brand mark + サイトタイトルを差し替えるため SiteTitle component を override。
      // ロゴは CSS グラデーションで描画する (design 準拠) ため Starlight 標準の logo
      // config は使わない。ファビコン・OG 画像用の webp は public/hapbeat-logo.webp。
      components: {
        SiteTitle: './src/components/SiteTitle.astro',
      },
      // i18n: 日本語を root (URL prefix なし) として配信し、英語を /en/ 配下に。
      // Starlight の慣例で「default = root」「alternate = /<lang>/」のパターン。
      // 英訳は AI 訳を順次掲載予定。未訳ページは fallback メッセージで案内される。
      defaultLocale: 'root',
      locales: {
        root: { label: '日本語', lang: 'ja' },
        en: { label: 'English', lang: 'en' },
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
        //   src/content/docs/docs/<short>/ に集約する。
        // autogenerate でそのディレクトリ配下を自動でサイドバー化する。
        {
          label: 'Hapbeat Manager',
          autogenerate: { directory: 'docs/manager' },
        },
        {
          label: 'Hapbeat Studio',
          autogenerate: { directory: 'docs/studio' },
        },
        {
          label: 'Unity SDK',
          autogenerate: { directory: 'docs/unity-sdk' },
        },
        {
          label: 'Unreal SDK',
          badge: { text: 'WIP', variant: 'caution' },
          autogenerate: { directory: 'docs/unreal-sdk' },
        },
        {
          label: 'Creative Kit',
          badge: { text: 'WIP', variant: 'caution' },
          autogenerate: { directory: 'docs/creative-kit' },
        },
        {
          label: 'Device Firmware',
          autogenerate: { directory: 'docs/firmware' },
        },
        {
          label: 'Kit Tools (CLI)',
          autogenerate: { directory: 'docs/kit-tools' },
        },
        {
          label: 'Contracts (仕様)',
          autogenerate: { directory: 'docs/contracts' },
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
