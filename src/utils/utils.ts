export const changeTitle = (newTitle: string) => {
    document.title = newTitle;
};

export const changeIcon = (iconUrl: string) => {
    const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']") || document.createElement("link");
    link.rel = "icon";
    link.href = iconUrl;

    if (!document.querySelector("link[rel*='icon']")) {
        document.head.appendChild(link);
    }
};

export const convertKeys = (obj: Record<string, any>, keyMap: Record<string, string>): Record<string, any> => {
    return Object.keys(obj).reduce((acc, key) => {
        const newKey = keyMap[key] || key;
        acc[newKey] = obj[key];
        return acc;
    }, {} as Record<string, any>);
};

export const setDocumentTitle = (customTitle?: string) => {
  if (customTitle) {
    document.title = `${customTitle} | Title`;
  } else {
    document.title = "Title";
  }
};

export const buildQuery = (params: Record<string, any>): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.append(key, String(value));
  });

  return query.toString();
};

export const buildURL = (base: string, params: Record<string, any>): string => {
  const query = buildQuery(params);
  return query ? `${base}?${query}` : base;
};

export const buildApiUrl = (path: string) => {
  if (!path) return '';
  const apiUrl = import.meta.env.VITE_API_URL;
  // nếu BE sau này trả full URL thì vẫn chơi được
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${apiUrl}${path}`;
};
