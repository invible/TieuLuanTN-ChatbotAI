export const getOpenKeysFromPath = (path) => {
  if (
    ['/products', '/categories', '/brands', '/receipts'].includes(path)
  ) {
    return ['product-management'];
  }
  return [];
};