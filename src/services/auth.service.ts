import { apiClient } from "@/api/client";
import type {
  ApiResponse,
  LoginResponseDTO,
  RegisterDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  ResendVerificationDTO,
} from "@/api/types";

export async function register(payload: RegisterDTO) {
  return apiClient.post<null>("/auth/register", payload);
}

export async function login(payload: { email: string; password: string }) {
  return apiClient.post<LoginResponseDTO>("/auth/login", payload);
}

export async function logout() {
  return apiClient.post<null>("/auth/logout", {});
}

export async function changePassword(payload: ChangePasswordDTO) {
  return apiClient.post<null>("/auth/change-password", payload);
}

export async function forgotPassword(payload: ForgotPasswordDTO) {
  return apiClient.post<null>("/auth/forgot-password", payload);
}

export async function resetPassword(payload: ResetPasswordDTO) {
  return apiClient.post<null>("/auth/reset-password", payload);
}

export async function verifyEmail(email: string, token: string): Promise<ApiResponse<null>> {
  return apiClient.get<null>(`/auth/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
}

export async function resendVerification(payload: ResendVerificationDTO) {
  return apiClient.post<null>("/auth/resend-verification", payload);
}
