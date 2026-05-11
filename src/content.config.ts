import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// docs schema を拡張して、Diátaxis 4 区分の `kind:` frontmatter を許可する。
// 設定値は src/components/PageTitle.astro → KindBadge.astro が読み取り、
// ページ上部にバッジを表示する。
export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        kind: z.enum(['tutorial', 'howto', 'reference', 'explanation']).optional(),
      }),
    }),
  }),
};
