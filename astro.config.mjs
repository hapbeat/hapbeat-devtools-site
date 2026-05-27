import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';
import { imageSize } from 'image-size';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 参考: docs/protocol と docs/kit 等の情報源は各 repo の docs/ を
// scripts/fetch-docs.mjs で src/content/docs/docs/ に取り込んでから build する。

// sidebar の explicit slug item を「ソースが draft / 不在のとき自動除外」する helper。
// 使い方: items 配列で `{ slug: '...' }` の代わりに `pub('...')` を呼ぶと、
//   - ソース docs/ にファイルがある + draft でない → そのまま `{ slug }` を返す
//   - draft: true または ファイル不在 → null を返す
// 親側で `.filter(Boolean)` すれば missing slug の Starlight build エラーを回避できる。
// 検査対象は src/ 配下ではなく **docs/ 配下のソース** (fetch-docs 経由で同期される)。
// slug に対応するソース .md/.mdx ファイルの絶対パスを返す。
// fetch-docs の数字 prefix (`001-foo.md` 等) が付いていても解決できるよう、
// 直接マッチ → 同一ディレクトリ内で prefix 付きを探す、の 2 段階。
function resolveSourceFile(slug) {
  const rel = slug.replace(/^docs\//, '');
  // 1) prefix なし直接マッチ
  for (const ext of ['.md', '.mdx']) {
    const direct = path.join(__dirname, 'docs', rel + ext);
    if (existsSync(direct)) return direct;
  }
  // 2) 同ディレクトリ内で `^\d+[-_]<basename>\.(md|mdx)$` を探す
  const dir = path.join(__dirname, 'docs', path.dirname(rel));
  const basename = path.basename(rel);
  if (!existsSync(dir)) return null;
  try {
    for (const e of readdirSync(dir)) {
      const m = e.match(/^\d+[-_](.+)\.(md|mdx)$/);
      if (m && m[1] === basename) return path.join(dir, e);
    }
  } catch {}
  return null;
}

function pub(slug) {
  const file = resolveSourceFile(slug);
  if (!file) return null;
  try {
    const raw = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const fm = raw.match(/^---\n([\s\S]*?)\n---/);
    if (fm && /^draft\s*:\s*true\s*$/m.test(fm[1])) return null;
    return { slug };
  } catch {
    return null;
  }
}

// rehype plugin: markdown 内の <a href> を以下の条件で新タブ化する。
// ルール:
//   - anchor (#xxx) → 同タブ
//   - mailto:, tel: → 新タブ扱い
//   - 別ドメイン → 新タブ
//   - 同一ドメイン (devtools.hapbeat.com) → 同タブ
//   - **例外**: /studio/ 配下 (パスが /studio で始まるもの) は別 SPA なので新タブ
const SITE_HOSTNAME = 'devtools.hapbeat.com';
const isStudioPath = (p) => p === '/studio' || p.startsWith('/studio/');
// markdown 内の画像 (`![]()` 由来) を build 時に最大幅で自動リサイズする
// remark プラグイン。
//
// なぜ remark (MDAST) で実装するか:
//   - Astro の markdown image 処理は MDAST → HAST 変換時点で src を
//     `/_astro/<hash>.webp` の最適化済 URL に書き換える
//   - rehype (HAST) 段階では既にローカルファイルパスが失われている
//   - MDAST の `image` ノードは `node.url` に元パスを保持しているので
//     その段階で intrinsic 寸法を読み、`data.hProperties.width` で
//     Astro の image service にリサイズ指示を渡す
//
// MAX_WIDTH は Retina 2x を想定した上限。表示幅 ~ 800px のサイトで
// 1600px ソースを許容する設定。
const MAX_IMAGE_WIDTH = 1600;
const IMAGE_SOURCE_ROOTS = [
  path.join(__dirname, 'src', 'content', 'docs', 'docs'),  // fetch-docs 後の場所
  path.join(__dirname, 'docs'),                            // ソース docs/
  path.join(__dirname, 'public'),
];

// 画像パスエイリアス。markdown `![]()` で `@assets/foo.png` のように書くと
// 起点ファイルとの相対パスに自動変換される (ファイル毎に `../assets/` の階数を
// 気にしなくて済む)。追加したい場合はこの辞書に書く。
const IMAGE_PATH_ALIASES = {
  '@assets/': path.join(__dirname, 'docs', 'assets'),
};
function resolveImageAlias(src, mdFilePath) {
  if (typeof src !== 'string' || !mdFilePath) return src;
  for (const [prefix, absRoot] of Object.entries(IMAGE_PATH_ALIASES)) {
    if (!src.startsWith(prefix)) continue;
    const tail = src.slice(prefix.length);
    const absTarget = path.join(absRoot, tail);
    const rel = path.relative(path.dirname(mdFilePath), absTarget);
    return rel.split(path.sep).join('/');  // Windows path → POSIX
  }
  return src;
}
function resolveLocalImage(src, mdFilePath) {
  // src 例: "../assets/foo.png" / "./assets/foo.png" / "/assets/foo.png"
  if (typeof src !== 'string') return null;
  if (/^https?:\/\//.test(src) || src.startsWith('data:')) return null;
  // 1) 処理中の .md ファイルからの相対解決を最優先
  if (mdFilePath) {
    const rel = path.resolve(path.dirname(mdFilePath), src);
    if (existsSync(rel)) return rel;
  }
  // 2) IMAGE_SOURCE_ROOTS から探す (../ や / は剥がす)
  const cleaned = src.replace(/^(\.\.?\/)+/, '').replace(/^\//, '');
  for (const root of IMAGE_SOURCE_ROOTS) {
    const candidate = path.join(root, cleaned);
    if (existsSync(candidate)) return candidate;
    const fallback = path.join(root, 'assets', path.basename(cleaned));
    if (existsSync(fallback)) return fallback;
  }
  return null;
}
function getIntrinsicSize(absPath) {
  try {
    const buf = readFileSync(absPath);
    return imageSize(buf);
  } catch {
    return null;
  }
}
// 内部リンクの自動タイトル注入。
//
// 書き方:
//   [](/docs/sdk-integration/unity-sdk/fire-vs-clip/)
//   → ビルド時に [Fire と Clip を実装する](/docs/.../fire-vs-clip/) に置換
//
// 仕組み:
//   - 空テキスト `[]()` で内部 `/docs/...` URL を指す link ノードを検出
//   - URL からコレクション内ファイルパスを引いて frontmatter `title` を読む
//   - link.children を title テキストに置換
//
// テキスト付き `[hand-written](path)` は触らない (明示指定が常に優先)。
// 外部 URL や anchor (#…) のみのリンクも対象外。
function resolveTitleFromContentSlug(url) {
  if (typeof url !== 'string') return null;
  if (/^https?:\/\//.test(url) || url.startsWith('mailto:') || url.startsWith('#')) return null;
  // /docs/concepts/architecture/ → "docs/concepts/architecture"
  const slug = url.replace(/^\//, '').replace(/#.*$/, '').replace(/\?.*$/, '').replace(/\/$/, '');
  if (!slug) return null;
  const base = path.join(__dirname, 'src', 'content', 'docs', slug);
  for (const ext of ['.md', '.mdx']) {
    const file = base + ext;
    if (!existsSync(file)) continue;
    try {
      const raw = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
      const fm = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!fm) return null;
      const tm = fm[1].match(/^title\s*:\s*"?([^"\n]+?)"?\s*$/m);
      return tm ? tm[1].trim() : null;
    } catch {
      return null;
    }
  }
  return null;
}
function remarkAutoLinkTitle() {
  return (tree) => {
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'link' && typeof node.url === 'string') {
        // empty link text 判定: children なし or 単一の空 text ノード
        const isEmpty =
          !Array.isArray(node.children) ||
          node.children.length === 0 ||
          (node.children.length === 1 &&
            node.children[0].type === 'text' &&
            (node.children[0].value || '').trim() === '');
        if (isEmpty && node.url.startsWith('/docs/')) {
          const title = resolveTitleFromContentSlug(node.url);
          if (title) {
            node.children = [{ type: 'text', value: title }];
          }
        }
      }
      if (Array.isArray(node.children)) {
        for (const child of node.children) walk(child);
      }
    };
    walk(tree);
  };
}

function remarkImageMaxWidth() {
  return (tree, file) => {
    const mdPath = file?.path;
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'image' && typeof node.url === 'string') {
        node.data = node.data || {};
        node.data.hProperties = node.data.hProperties || {};

        // パスエイリアス (`@assets/foo.png`) を MD ファイルからの相対パスに変換。
        // Astro の image service は相対パスを期待するので、自前で resolve してから
        // 元の URL を上書きする。これで以後の処理 (resize / WebP 化等) も普通に動く。
        node.url = resolveImageAlias(node.url, mdPath);

        // alt 末尾の `{.class1 .class2}` を抽出して className に変換。
        // markdown `![]()` 構文では class を直接付けられないので、alt 内に
        // `![説明 {.bg-white}](path)` のように書いてもらう運用。
        // 抽出後の alt はディレクティブを除いたクリーンなテキストになる。
        if (typeof node.alt === 'string') {
          const m = node.alt.match(/^(.*?)\s*\{((?:\s*\.[\w-]+)+)\s*\}\s*$/);
          if (m) {
            node.alt = m[1].trim();
            const classes = m[2]
              .trim()
              .split(/\s+/)
              .map((s) => s.replace(/^\./, ''))
              .filter(Boolean);
            if (classes.length) {
              const existing = node.data.hProperties.className;
              node.data.hProperties.className = Array.isArray(existing)
                ? [...existing, ...classes]
                : existing
                ? [existing, ...classes]
                : classes;
            }
          }
        }

        if (node.data.hProperties.width == null) {
          const abs = resolveLocalImage(node.url, mdPath);
          const dim = abs ? getIntrinsicSize(abs) : null;
          if (dim && dim.width) {
            node.data.hProperties.width = Math.min(MAX_IMAGE_WIDTH, dim.width);
          }
        }
      }
      if (Array.isArray(node.children)) {
        for (const child of node.children) walk(child);
      }
    };
    walk(tree);
  };
}

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
    remarkPlugins: [
      remarkImageMaxWidth,  // build 時に markdown 画像を最大 MAX_IMAGE_WIDTH へリサイズ
      remarkAutoLinkTitle,  // [](path) 形式の内部リンクに target の title を自動注入
    ],
    rehypePlugins: [
      rehypeNewTabExternal,
      [rehypeMermaid, { strategy: 'inline-svg' }],
    ],
  },
  // 旧 IA (2026-05-12 再編前) の URL は外部リンクや SNS で参照されている可能性が
  // あるためリダイレクトで温存する。新規追加は控えめに。
  redirects: {
    '/docs/getting-started': '/docs/start-here/getting-started/',
    '/docs/unity-sdk/getting-started': '/docs/sdk-integration/unity-sdk/getting-started/',
    // Tutorial → Showcase rename (2026-05-24). 旧 URL は外部から参照されている
    // 可能性があるためリダイレクトで温存。
    '/docs/sdk-integration/unity-sdk/tutorial': '/docs/sdk-integration/unity-sdk/showcase/',
    '/docs/sdk-integration/unity-sdk/tutorial/walkthrough': '/docs/sdk-integration/unity-sdk/showcase/walkthrough/',
    '/docs/sdk-integration/unity-sdk/tutorial/method-choice': '/docs/sdk-integration/unity-sdk/showcase/method-choice/',
    // Reference トップレベル廃止 (2026-05-24): Contracts を Concepts 配下に移動
    '/docs/reference': '/docs/concepts/',
    '/docs/reference/contracts': '/docs/concepts/contracts/',
    '/docs/reference/contracts/overview': '/docs/concepts/contracts/overview/',
    // showcase index → overview (2026-05-24)
    '/docs/sdk-integration/unity-sdk/showcase': '/docs/sdk-integration/unity-sdk/showcase/overview/',
    // wifi-setup を Studio onboarding に統合 (2026-05-26)
    '/docs/hardware/wifi-setup': '/docs/tools/studio/initial-setup/',
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
            { label: 'Studio', autogenerate: { directory: 'docs/tools/studio' } },
            { label: 'Helper',         autogenerate: { directory: 'docs/tools/helper' } },
          ],
        },
        { label: '🔧 Hardware',       autogenerate: { directory: 'docs/hardware' } },
        {
          label: '📦 SDK Integration',
          items: [
            {
              // Unity SDK: autogenerate だと内側の showcase/ が小文字グループになるため
              // explicit items で並べる。順序は各ページ frontmatter の sidebar.order と
              // 同じになるよう手で揃える。
              // 各 slug は pub() でラップしてあり、ソース docs/ にファイルが無いか
              // `draft: true` のときは自動的に null になる。`.filter(Boolean)` で
              // 取り除かれるため、ファイル退避 / draft 化のたびに config 編集は不要。
              label: 'Unity SDK',
              items: [
                pub('docs/sdk-integration/unity-sdk/getting-started'),
                pub('docs/sdk-integration/unity-sdk/integration'),
                {
                  label: 'Showcase',
                  items: [
                    pub('docs/sdk-integration/unity-sdk/showcase/overview'),
                    pub('docs/sdk-integration/unity-sdk/showcase/walkthrough'),
                    pub('docs/sdk-integration/unity-sdk/showcase/wiring'),
                    pub('docs/sdk-integration/unity-sdk/showcase/method-choice'),
                  ].filter(Boolean),
                },
                // howto (mode 判断・実装 → 拡張用途 → ワークフロー支援)
                pub('docs/sdk-integration/unity-sdk/xri-handdemo-quickstart'),
                pub('docs/sdk-integration/unity-sdk/fire-vs-clip'),
                pub('docs/sdk-integration/unity-sdk/streaming'),
                pub('docs/sdk-integration/unity-sdk/multi-app'),
                pub('docs/sdk-integration/unity-sdk/ai-assisted-workflow'),
                // reference
                pub('docs/sdk-integration/unity-sdk/triggers'),
                pub('docs/sdk-integration/unity-sdk/event-map'),
                pub('docs/sdk-integration/unity-sdk/parameter-binding'),
                pub('docs/sdk-integration/unity-sdk/editor-menus'),
                pub('docs/sdk-integration/unity-sdk/installation'),
              ].filter(Boolean),
            },
          ],
        },
        { label: '❓ Support',        autogenerate: { directory: 'docs/support' } },
      ],
      customCss: [
        './src/styles/custom.css',
        './src/styles/components.css',
        './src/styles/campaign.css',
      ],
    }),
  ],
});
