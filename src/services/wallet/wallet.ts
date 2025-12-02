import { postData } from "../api/apiService"

export const chargeRegradeFee = async(amount: number) => {
    const response = await postData("/wallet/charge-regrade-fee", amount)
    return response.data
}