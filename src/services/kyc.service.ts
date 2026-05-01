import { apiClient } from "@/api/client";
import type {
  ApiResponse,
  KycUploadResponseDTO,
  KycVerificationResponseDTO,
  UploadIdRequestDTO,
} from "@/api/types";

export async function uploadStudentId(
  payload: UploadIdRequestDTO,
): Promise<ApiResponse<KycUploadResponseDTO>> {
  const formData = new FormData();
  formData.append("file", payload.file);

  return apiClient.postFormData<KycUploadResponseDTO>(
    "/kyc/upload-id",
    formData,
  );
}

export async function verifyFace(): Promise<
  ApiResponse<KycVerificationResponseDTO>
> {
  return apiClient.post<KycVerificationResponseDTO>("/kyc/verify-face", {});
}

export async function verifyPhone(): Promise<
  ApiResponse<KycVerificationResponseDTO>
> {
  return apiClient.post<KycVerificationResponseDTO>("/kyc/verify-phone", {});
}

export async function getKycStatus(): Promise<
  ApiResponse<KycVerificationResponseDTO>
> {
  return apiClient.get<KycVerificationResponseDTO>("/kyc/status");
}

export async function downloadKycDocument(documentId: string) {
  return apiClient.downloadFile(`/kyc/documents/${documentId}/download`);
}
