import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';

// 参考: docs/protocol と docs/kit 等の情報源は各 repo の docs/ を
// scripts/fetch-docs.mjs で src/content/docs/docs/ に取り込んでから build する。

// rehype plugin: markdown 内の <a href> を以下の条件で新タブ化する。
// ルール:
//   - anchor (#xxx) → 同タブ
//   - mailto:, tel: → 新タブ扱い
//   - 別ドメイン → 新タブ
//   - 同一ドメイン (devtools.hapbeat.com) → 同タブ
//   - **例外**: /studio/ 配下 (パスが /studio で始まるもの) は別 SPA なので新タブ
const SITE_HOSTNAME = 'devtools.hapbeat.com';
const isStudioPath = (p) => p === '/studio' || p.startsWith('/studio/');
function rehypeNewTabExternal() {
  const shouldNewTab = (href) => {
    if (typeof href !== 'string' || !href) return false;
    if (href.startsWith('#')) return false;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return true;
    if (href.startsWith('/')) return isStudioPath(href);
    try {
      const u = new URL(href);
      if (u.hostname !== SITE_HOSTNAME) return true;
      return isStudioPath(u.pathname);
    } catch {
      return false;
    }
  };
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'element' && node.tagName === 'a' && node.properties) {
      const href = node.properties.href;
      if (typeof href === 'string') {
        if (shouldNewTab(href)) {
          node.properties.target = '_blank';
          node.properties.rel = 'noopener noreferrer';
        } else if (node.properties.target === '_blank') {
          delete node.properties.target;
        }
      }
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child);
    }
  };
  return (tree) => walk(tree);
}

export default defineConfig({
  site: 'https://devtools.hapbeat.com',
  server: {
    // hapbeat-studio が Vite default の 5173 を使うため衝突を避けて 1313 に固定。
    // 1313 は Hugo docs site の慣例ポートで覚えやすい。
    port: 1313,
  },
  markdown: {
    rehypePlugins: [rehypeNewTabExternal, [rehypeMermaid, { strategy: 'inline-svg' }]],
  },
  // 旧 IA (2026-05-12 再編前) の URL は外部リンクや SNS で参照されている可能性が
  // あるためリダイレクトで温存する。新規追加は控えめに。
  redirects: {
    '/docs/getting-started': '/docs/start-here/getting-started/',
    '/docs/unity-sdk/getting-started': '/docs/sdk-integration/unity-sdk/getting-started/',
    // 2026-05-15: tools/firmware/ → device/ (Hapbeat 本体セクションに分離)
    '/docs/tools/firmware/troubleshooting': '/docs/device/troubleshooting/',
    '/docs/tools/firmware/wifi-setup': '/docs/device/wifi-setup/',
  },
  integrations: [
    starlight({
      title: 'Hapbeat devtools',
      description: '触覚デバイス Hapbeat のクリエイター・開発者向けツールとドキュメント',
      favicon: '/favicon.svg',
      // Expressive Code: macOS ターミナル風 / ファイルタブ風のフレームを無効化。
      // コピー機能だけ残してシンプルなコードブロックにする。
      expressiveCode: {
        defaultProps: {
          frame: 'none',
        },
      },
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
        // TableOfContents: 右サイドバー TOC 上部に Diátaxis 区分バッジを表示
        // (h1 隣接だとタイトル長で改行されるため、幅固定の右サイドバーに配置)
        TableOfContents: './src/components/TableOfContents.astro',
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
      // IA 設計プラン: docs/instructions-docs-ia-restructure-202605111600.md (workspace)
      // Diátaxis 4 区分: Tutorial / How-to / Reference / Explanation
      // ディレクトリ構造 = サイドバー構造。ページラベルは各 .md の title (frontmatter)。
      // サブグループだけは autogenerate がディレクトリ名をそのまま label に使うため、
      // friendly な表示名 (Hapbeat Studio 等) を items で明示する。
      // 物理パス: docs/<group>/[<sub>/]<page>.md   URL: /docs/<group>/[<sub>/]<page>/
      sidebar: [
        { label: '🎯 Start Here',     autogenerate: { directory: 'docs/start-here' } },
        { label: '💡 Concepts',       autogenerate: { directory: 'docs/concepts' } },
        {
          label: '🛠 Tools',
          items: [
            { label: 'Hapbeat Studio', autogenerate: { directory: 'docs/tools/studio' } },
            { label: 'Helper',         autogenerate: { directory: 'docs/tools/helper' } },
          ],
        },
        { label: '🔧 Hapbeat 本体',   autogenerate: { directory: 'docs/device' } },
        {
          label: '📦 SDK Integration',
          items: [
            {
              // Unity SDK: autogenerate だと内側の tutorial/ が小文字グループになるため
              // explicit items で並べる。順序は各ページ frontmatter の sidebar.order と
              // 同じになるよう手で揃える。
              label: 'Unity SDK',
              items: [
                { slug: 'docs/sdk-integration/unity-sdk/getting-started' },
                { slug: 'docs/sdk-integration/unity-sdk/integration' },
                {
                  label: 'Tutorial',
                  items: [
                    { slug: 'docs/sdk-integration/unity-sdk/tutorial' },
                    { slug: 'docs/sdk-integration/unity-sdk/tutorial/walkthrough' },
                    { slug: 'docs/sdk-integration/unity-sdk/tutorial/method-choice' },
                  ],
                },
                { slug: 'docs/sdk-integration/unity-sdk/xri-handdemo-quickstart' },
                // howto (mode 判断・実装 → 拡張用途 → ワークフロー支援)
                { slug: 'docs/sdk-integration/unity-sdk/fire-vs-clip' },
                { slug: 'docs/sdk-integration/unity-sdk/streaming' },
                { slug: 'docs/sdk-integration/unity-sdk/multi-app' },
                { slug: 'docs/sdk-integration/unity-sdk/ai-assisted-workflow' },
                // reference
                { slug: 'docs/sdk-integration/unity-sdk/triggers' },
                { slug: 'docs/sdk-integration/unity-sdk/event-map' },
                { slug: 'docs/sdk-integration/unity-sdk/parameter-binding' },
                { slug: 'docs/sdk-integration/unity-sdk/editor-menus' },
                { slug: 'docs/sdk-integration/unity-sdk/installation' },
              ],
            },
          ],
        },
        {
          label: '📖 Reference',
          items: [
            { label: 'Reference 索引',    slug: 'docs/reference' },
            { label: 'Contracts 仕様',     autogenerate: { directory: 'docs/reference/contracts' } },
          ],
        },
        { label: '❓ Support',        autogenerate: { directory: 'docs/support' } },
      ],
      customCss: ['./src/styles/custom.css', './src/styles/components.css'],
    }),
  ],
});
