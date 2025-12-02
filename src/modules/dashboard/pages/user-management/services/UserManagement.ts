import { deleteData, getData, putData } from "@/services/api/apiService"
import type { UserMini } from "@/types"
import { buildQuery } from "@/utils"

export interface UsersSummaryResponse {
    totalUser: number,
    activeUser: number,
    inactiveUser: number,
    adminUser: number,
}

export interface PageResponse<T> {
    content: T[],
    totalPages: number,
    totalElements: number,
    number: number,
    size: number,
}

interface ApiResponse<T> {
    status: string,
    message: string,
    data: T,
}

export interface UpdateUserPayload {
    firstName: string,
    lastName: string,
}

export const getUserSummaryAPI = async() => {
    const response = await getData<UsersSummaryResponse>("/users/sumary")
    return response.data
}

export const getAllUserAPI = async(
    page: number = 0,
    size: number = 5,
    search: string = "",
    role: string = "all",
    status: string = "all",
) => {
    const query = buildQuery({
        page,
        size,
        search: search?.trim() ?? undefined,
        role: role === "all" ? "all" : role,
        status: status === "all" ? "all" : status,
    })
    const response = await getData<PageResponse<UserMini>>(`/users${query ? `?${query}` : ""}`)
    return response.data
}

export const getUserDetailAPI = async(id: number) => {
    const response = await getData<ApiResponse<UserMini>>(`/users/${id}`)
    return response.data
}

export const updateUserProfileAPI = async(payload: UpdateUserPayload) => {
    const response = await putData<ApiResponse<UserMini>>("/users/update-profile", payload)
    return response.data
}

export const deleteUserAPI = async(id: number) => {
    const response = await deleteData<ApiResponse<boolean>>(`/users/${id}`)
    return response.data
}
