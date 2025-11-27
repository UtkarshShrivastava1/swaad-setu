
export const getTenantPath = (rid: string, path: string = ''): string => {
  // Ensure the path starts with a slash
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  return `/t/${rid}${formattedPath}`;
};

export const getTenantApiPath = (rid: string, path: string = ''): string => {
  // Ensure the path starts with a slash
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  return `/api/${rid}${formattedPath}`;
};
