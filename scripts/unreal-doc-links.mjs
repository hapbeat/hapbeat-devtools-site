// Source docs retain GitHub-compatible sibling .md links; the portal uses routes.
export function rewriteUnrealDocLinks(markdown) {
  return markdown.split(/(^```[^\n]*\n[\s\S]*?^```[^\n]*$|`[^`\n]+`)/gm)
    .map((part, i) => i % 2 ? part : part.replace(
      /(\]\()\.\/([a-z0-9-]+)\.md(#[^\s)]*)?(\))/gi,
      (_, open, slug, hash = '', close) => `${open}/docs/sdk-integration/unreal-sdk/${slug}/${hash}${close}`,
    )).join('');
}
