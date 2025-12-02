import { deleteData, getData, postData } from "@/services/api/apiService";
import type { NotificationDTO, PageResponse } from "@/types/notification";

const BASE_PATH = "/notification";

export interface FetchNotificationOptions {
  page?: number;
  size?: number;
  sort?: string;
}

export const fetchUserNotificationsAPI = async (
  userId: number,
  options: FetchNotificationOptions = {}
): Promise<PageResponse<NotificationDTO>> => {
  const { page = 0, size = 20, sort = "createdAt,desc" } = options;
  const response = await getData<PageResponse<NotificationDTO>>(
    `${BASE_PATH}/user/${userId}/paged`,
    {
      params: { page, size, sort },
    }
  );

  return response.data;
};

export const markNotificationAsReadAPI = async (id: number) => {
  const response = await postData<void>(`${BASE_PATH}/${id}/mark-as-read`, {});
  return response.data;
};

export const deleteNotificationAPI = async (id: number) => {
  const response = await deleteData<void>(`${BASE_PATH}/${id}`);
  return response.data;
};
