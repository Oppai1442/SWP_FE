import { getData, postData } from "@/services/api/apiService";

export const TWO_FACTOR_MESSAGE = "Please enter the 2FA code sent to your device.";

export type TwoFactorStatus = "ENABLED" | "DISABLED";

interface TwoFactorStatusResponse {
  enabled: boolean;
}

export const getTwoFactorStatus = (): TwoFactorStatus =>
  (localStorage.getItem("user.twoFactorStatus") as TwoFactorStatus) ?? "DISABLED";

export const setTwoFactorStatus = (status: TwoFactorStatus) => {
  localStorage.setItem("user.twoFactorStatus", status);
};

export const fetchTwoFactorStatus = async (): Promise<boolean> => {
  const response = await getData<TwoFactorStatusResponse>("/users/me/security");
  const enabled = response?.enabled ?? false;
  setTwoFactorStatus(enabled ? "ENABLED" : "DISABLED");
  return enabled;
};

export const updateTwoFactorStatus = async (enabled: boolean, verificationCode?: string) => {
  const response = await postData<TwoFactorStatusResponse>("/users/me/security", {
    enabled,
    verificationCode,
  });
  const nextStatus = response?.enabled ? "ENABLED" : "DISABLED";
  setTwoFactorStatus(nextStatus);
  return response.enabled;
};

export const requireTwoFactorAuth = async (): Promise<string> => {
  const code = window.prompt(TWO_FACTOR_MESSAGE, "");
  if (!code || !code.trim()) {
    throw new Error("Two-factor authentication is required.");
  }

  const trimmed = code.trim();
  if (trimmed.length < 4) {
    throw new Error("Invalid 2FA code.");
  }

  return trimmed;
};
