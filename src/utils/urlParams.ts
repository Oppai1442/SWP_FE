export const getQueryParams = (): URLSearchParams => {
    return new URLSearchParams(window.location.search);
};

export const getQueryParam = (key: string): string | null => {
    return getQueryParams().get(key);
};

export const setQueryParam = (key: string, value: any) => {
    const params = new URLSearchParams(window.location.search);
    if (value === null || value === undefined || value === '') {
        params.delete(key);
    } else {
        params.set(key, String(value));
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
};



export const deleteQueryParam = (key: string) => {
    const params = getQueryParams();
    params.delete(key);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
};
