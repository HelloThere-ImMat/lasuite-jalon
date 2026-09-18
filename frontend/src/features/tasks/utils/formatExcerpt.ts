// Parses the "<Speaker> : <quoted message>" convention for source.excerpt
// (docs/DOMAIN_MODEL.md / docs/UX_UI.md) so the speaker can be rendered bold.
// Falls back gracefully if an excerpt doesn't follow the convention (nothing
// upstream enforces it yet — no Milestone 6 mocks exist).
export function parseExcerpt(excerpt: string): { speaker: string | null; message: string } {
  const separatorIndex = excerpt.indexOf(":");
  if (separatorIndex === -1) return { speaker: null, message: excerpt };
  return {
    speaker: excerpt.slice(0, separatorIndex).trim(),
    message: excerpt.slice(separatorIndex + 1).trim(),
  };
}
