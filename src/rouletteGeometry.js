// Isolated wheel geometry: any editable option count is supported.
export function sectorPath(index, count, radius = 199, center = 200) {
  if (!Number.isInteger(count) || count < 2 || !Number.isInteger(index) || index < 0 || index >= count) {
    throw new RangeError("Invalid roulette sector");
  }
  const step = 360 / count;
  const first = (-90 - step / 2 + index * step) * Math.PI / 180;
  const last = first + step * Math.PI / 180;
  const x1 = center + radius * Math.cos(first);
  const y1 = center + radius * Math.sin(first);
  const x2 = center + radius * Math.cos(last);
  const y2 = center + radius * Math.sin(last);
  return `M ${center} ${center} L ${x1.toFixed(4)} ${y1.toFixed(4)} A ${radius} ${radius} 0 ${step > 180 ? 1 : 0} 1 ${x2.toFixed(4)} ${y2.toFixed(4)} Z`;
}
