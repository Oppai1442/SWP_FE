import showToast from "@/utils/toast";

export const handleAuthError = (error: any) => {
  if (error.response) {
    const { status } = error.response;
    const messageMap: Record<number, string> = {
      200: "Sign-in successful! Welcome back.",
      201: "Account created successfully! Welcome to the platform.",
      400: "Please check your input and try again.",
      401: "Incorrect email or password.",
      403: "Your account is restricted. Please contact support.",
      409: "An account with this email already exists.",
      500: "An error occurred on the server. Please try again later.",
    };

    const message = messageMap[status] || "An unexpected error occurred. Please try again.";
    const type = status === 200 || status === 201 ? "success" : "warning";

    showToast(type, message);
  } else {
    showToast("error", "Network error: Unable to connect. Please check your internet connection.");
    console.error("Network error or no response:", error);
  }
};
