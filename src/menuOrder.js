export const placementRank = (item) =>
  item.isDrinkOfNight ? 0 : item.isFeatured ? 1 : 2;

export const customerOrder = (items) =>
  [...items].sort(
    (left, right) =>
      placementRank(left) - placementRank(right) ||
      left.sortOrder - right.sortOrder,
  );

export function reorderMenuItem(items, sourceId, targetId, position) {
  const sourceIndex = items.findIndex((item) => item._id === sourceId);
  const targetIndex = items.findIndex((item) => item._id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex)
    return items;

  let insertAt = targetIndex + (position === "after" ? 1 : 0);
  const next = [...items];
  const [source] = next.splice(sourceIndex, 1);
  if (sourceIndex < insertAt) insertAt -= 1;
  next.splice(insertAt, 0, source);
  return next;
}
