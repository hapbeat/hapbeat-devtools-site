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
      favicon: '/favicon.svg',
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
      // Component overrides:
      //   - Header: design の topbar layout (brand / search / nav / lang / theme / github)
      //   - SiteTitle: brand mark (gradient + concentric) + Hapbeat / devtools + version chip
      //   - LanguageSelect: JA/EN ピル型 segmented control
      //   - Footer: Starlight default に加えてサイトフッター追加
      // ロゴ画像は使わず CSS グラデーションで描画するため logo config はなし。
      components: {
        Head: './src/components/Head.astro',
        Header: './src/components/Header.astro',
        SiteTitle: './src/components/SiteTitle.astro',
        LanguageSelect: './src/components/LanguageSelect.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
        SocialIcons: './src/components/SocialIcons.astro',
        Hero: './src/components/Hero.astro',
        Footer: './src/components/Footer.astro',
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
          label: 'Helper (CLI daemon)',
          autogenerate: { directory: 'docs/helper' },
        },
        {
          label: 'Studio',
          autogenerate: { directory: 'docs/studio' },
        },
        {
          label: 'Unity SDK',
          autogenerate: { directory: 'docs/unity-sdk' },
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
        // Unreal SDK / Creative Kit は未実装のため、独立したサブツリーは持たず
        // 「その他」配下にリンクのみ置く。
        // Downloads は docs ではなくリソース配布 (バイナリ等) のため
        // sidebar に入れず header nav 専用。
        // Showcase は将来「触覚デモを体験できる」専用ページとして再構築するため
        // sidebar から外し、現時点では header からも切り離す (URL は残す)。
        // FAQ / Changelog は docs 配下に移設済み (URL: /docs/faq/, /docs/changelog/)。
        {
          label: 'その他',
          items: [
            { label: 'FAQ', link: '/docs/faq/' },
            { label: 'サポート / お問い合わせ', link: '/docs/support/' },
            { label: 'Changelog', link: '/docs/changelog/' },
            { label: 'Unreal SDK (準備中)', link: '/docs/unreal-sdk/' },
            { label: 'Creative Kit (準備中)', link: '/docs/creative-kit/' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css', './src/styles/components.css'],
    }),
  ],
});
