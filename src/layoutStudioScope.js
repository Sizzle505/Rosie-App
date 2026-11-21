// Screen signatures are exact by design: no breakpoint or "similar size" fallback.
export const LAYOUT_UNLOCK_KEY = 'rosieverse.layout-studio.visible.v1';
export const PUBLISHED_PREFIX = 'rosieverse.layout-studio.published.v1.';
export const DRAFT_PREFIX = 'rosieverse.layout-studio.unpublished.v1.';

export function screenSignature(view) {
  const context = view || window;
  const width = Math.round(context.innerWidth);
  const height = Math.round(context.innerHeight);
  const ratio = Math.round((context.devicePixelRatio || 1) * 100) / 100;
  if (context.matchMedia && context.matchMedia('(pointer: coarse)').matches) {
    const a = Math.round(Math.min(context.screen.width, context.screen.height));
    const b = Math.round(Math.max(context.screen.width, context.screen.height));
    const orientation = width >= height ? 'landscape' : 'portrait';
    // Screen dimensions stay stable when iOS Safari expands/collapses its bars.
    // The viewport WIDTH also distinguishes iPad split-view from full screen.
    return 'touch:' + a + 'x' + b + ':' + orientation + ':' + width + 'w@' + ratio;
  }
  // Desktop is scoped to the actual CSS browser viewport, not monitor model.
  return 'window:' + width + 'x' + height + '@' + ratio;
}

export function normalizeOffset(raw) {
  const item = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const between = (value, lower, upper, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(lower, Math.min(upper, n)) : fallback;
  };
  return {
    x: between(item.x, -2500, 2500, 0),
    y: between(item.y, -2500, 2500, 0),
    scale: between(item.scale, 0.3, 3, 1)
  };
}

export function normalizedLayouts(raw, targetMap) {
  const result = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
  for (const [page, targets] of Object.entries(targetMap)) {
    const values = raw[page];
    if (!values || typeof values !== 'object' || Array.isArray(values)) continue;
    const permitted = new Set(targets.map(item => item[0]));
    const pageResult = {};
    for (const [id, value] of Object.entries(values)) {
      if (!permitted.has(id)) continue;
      const normalized = normalizeOffset(value);
      if (normalized.x || normalized.y || normalized.scale !== 1) pageResult[id] = normalized;
    }
    if (Object.keys(pageResult).length) result[page] = pageResult;
  }
  return result;
}
