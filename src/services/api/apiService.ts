import axios from "./axiosInstance";

export const getData = <T>(url: string, config = {}) => axios.get<T>(url, config);
export const postData = <T>(url: string, data: any, config = {}) => axios.post<T>(url, data, config);
export const putData = <T>(url: string, data: any, config = {}) => axios.put<T>(url, data, config);
export const patchData = <T>(url: string, data: any, config = {}) => axios.patch<T>(url, data, config);
export const deleteData = <T>(url: string, config = {}) => axios.delete<T>(url, config);
