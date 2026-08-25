export function applyMenuItemUpdate(items, args) {
  const { sessionToken: _sessionToken, id, removeImage, ...changes } = args;

  return items.map((item) => {
    if (String(item._id) !== String(id)) return item;

    const updated = { ...item, ...changes };
    if (removeImage) {
      delete updated.imageUrl;
      delete updated.imageStorageId;
    } else if (
      changes.imageStorageId &&
      changes.imageStorageId !== item.imageStorageId
    ) {
      delete updated.imageUrl;
    }
    return updated;
  });
}
