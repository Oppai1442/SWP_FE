import { getData, postData } from "@/services/api/apiService"
import type { AccountDataResponse, UserUpdateProfile } from "../types"

export const getAccountDataAPI = async() => {
    const response = await getData<AccountDataResponse>("/users/get-account-data")
    return response.data
}

export const saveData = async(req: UserUpdateProfile) => {
    const response = await postData<boolean>("/users/update-profile", req)
    return response.data
}
