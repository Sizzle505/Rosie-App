// Deterministic editing targets for artwork and panels outside the curated registry.
// Only build this index while picking, or when this page has saved automatic edits.
export const AUTO_SELECTOR = [
  'img','picture','button','form','input','textarea','label','aside','nav','section',
  '[data-layout-target]','[role="search"]','[role="searchbox"]',
  '[class*="search"]','[class*="Search"]','[class*="panel"]','[class*="Panel"]',
  '[class*="lantern"]','[class*="Lantern"]','[class*="art"]','[class*="Art"]'
].join(',');

const stableClass = node => Array.from(node.classList || []).find(name =>
  !/^(?:rle-|is-|has-|active$|current$|selected$|open$|visible$|loading$)/.test(name)
) || '';

export function stableDomPath(element, root) {
  if (!element || !root || element === root || !root.contains(element)) return '';
  const path = [];
  let node = element;
  while (node && node !== root) {
    const tag = node.tagName.toLowerCase();
    const cls = stableClass(node);
    const siblings = Array.from(node.parentElement?.children || []).filter(item =>
      item.tagName === node.tagName && stableClass(item) === cls
    );
    const index = siblings.indexOf(node) + 1;
    const anchor = node.getAttribute('data-layout-target') || node.id || '';
    path.unshift(tag + (cls ? '.' + cls : '') + ':' + index + (anchor ? '#' + anchor : ''));
    if (anchor) break;
    node = node.parentElement;
  }
  return path.join('/');
}

export function hashPath(value) {
  let h=2166136261;
  for (let i=0;i<value.length;i++) {
    h=Math.imul(h ^ value.charCodeAt(i),16777619);
  }
  return (h>>>0).toString(36).padStart(7,'0');
}

export function autoIdFor(node,root) {
  const path=stableDomPath(node,root);
  return path ? 'auto-' + hashPath(path) : '';
}

export function automaticTargets(root=document.querySelector('.app-shell')) {
  if (!root) return [];
  const indexed=new Map();
  root.querySelectorAll(AUTO_SELECTOR).forEach(node=>{
    if (node.closest('.rle-ui,[data-rle-ignore]')) return;
    const id=autoIdFor(node,root);
    if (!id || indexed.has(id)) return;
    const name=node.getAttribute('aria-label') || node.getAttribute('alt') ||
      node.getAttribute('placeholder') || node.getAttribute('title') || '';
    const label=(name || stableClass(node) || node.tagName.toLowerCase()).trim().slice(0,64);
    indexed.set(id,{id,label,selector:'[automatic]',group:'Other page elements',node});
  });
  return Array.from(indexed.values());
}
