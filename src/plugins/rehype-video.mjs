// Puts a click-to-play YouTube video just before the article's second H2.
// Accepts a full YouTube link or a bare video ID in the article's `youtube` field.
export function youtubeId(value) {
  if (!value) return null;
  const m = String(value).match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  if (m) return m[1];
  return /^[\w-]{11}$/.test(value.trim()) ? value.trim() : null;
}

const isH2 = (n) =>
  (n.type === 'element' && n.tagName === 'h2') || (n.type === 'raw' && /^\s*<h2[\s>]/i.test(n.value));

export default function rehypeVideo() {
  return (tree, file) => {
    const id = youtubeId(file.data.astro?.frontmatter?.youtube);
    if (!id) return;
    const h2s = tree.children.map((n, i) => (isH2(n) ? i : -1)).filter((i) => i >= 0);
    const at = h2s[1] ?? tree.children.length;
    tree.children.splice(at, 0, {
      type: 'raw',
      value:
        `<div class="video"><button class="yt" type="button" data-id="${id}" aria-label="Play video" ` +
        `style="background-image:url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)"><span class="play" aria-hidden="true">&#9654;</span></button></div>`,
    });
  };
}
