import { apiClient } from "@/api/client";
import type {
  ApiResponse,
  ApplicationUser,
  PaginatedApiResponse,
  SupportContactDTO,
  UpdateUserKycStatusRequestDTO,
  UserRequestParameters,
} from "@/api/types";

function mapUser(input: ApplicationUser): ApplicationUser {
  const id = input.id ?? input.userId ?? "";

  return {
    ...input,
    id,
    userId: input.userId ?? id,
  };
}

export async function getUsers(
  params?: UserRequestParameters,
): Promise<PaginatedApiResponse<ApplicationUser>> {
  const response = await apiClient.getPaginated<
    ApplicationUser,
    UserRequestParameters
  >("/users", params);

  return {
    ...response,
    data: (response.data ?? []).map(mapUser),
  };
}

export async function updateUserKycStatus(
  userId: string,
  payload: UpdateUserKycStatusRequestDTO,
): Promise<ApiResponse<ApplicationUser>> {
  const response = await apiClient.patch<ApplicationUser>(
    `/users/${userId}/kyc-status`,
    payload,
  );

  return {
    ...response,
    data: response.data ? mapUser(response.data) : null,
  };
}

export async function suspendUser(userId: string): Promise<ApiResponse<null>> {
  return apiClient.post<null>(`/users/${userId}/suspend`, {});
}

export async function unsuspendUser(
  userId: string,
): Promise<ApiResponse<null>> {
  return apiClient.post<null>(`/users/${userId}/unsuspend`, {});
}

export async function deleteUser(userId: string): Promise<ApiResponse<null>> {
  return apiClient.delete<null>(`/users/${userId}`);
}

export async function getSupportContact(): Promise<
  ApiResponse<SupportContactDTO>
> {
  return apiClient.get<SupportContactDTO>("/users/support");
}
