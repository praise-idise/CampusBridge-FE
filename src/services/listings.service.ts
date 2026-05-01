import { apiClient } from "@/api/client";
import type {
  ApiResponse,
  CreateListingRequestDTO,
  Listing,
  ListingPhoto,
  ListingRequestParameters,
  ModerateListingRequestDTO,
  PaginatedApiResponse,
  UpdateListingRequestDTO,
} from "@/api/types";

function mapListingPhoto(input: ListingPhoto): ListingPhoto {
  return {
    id: input.id ?? input.listingPhotoId ?? "",
    listingPhotoId: input.listingPhotoId ?? input.id,
    fileName: input.fileName,
    contentType: input.contentType,
    uploadedAt: input.uploadedAt,
  };
}

function mapListing(input: Listing): Listing {
  return {
    ...input,
    id: input.id ?? input.listingId ?? "",
    listingId: input.listingId ?? input.id,
    ownerId: input.ownerId ?? input.ownerUserId ?? "",
    ownerUserId: input.ownerUserId ?? input.ownerId,
    status: input.status,
    photos: input.photos?.map(mapListingPhoto),
  };
}

function mapPaginatedListings(
  response: PaginatedApiResponse<Listing>,
): PaginatedApiResponse<Listing> {
  return {
    ...response,
    data: (response.data ?? []).map(mapListing),
  };
}

export async function getListings(
  params?: ListingRequestParameters,
): Promise<PaginatedApiResponse<Listing>> {
  const response = await apiClient.getPaginated<
    Listing,
    ListingRequestParameters
  >("/listings/mine", params);
  return mapPaginatedListings(response);
}

export async function getListingsBrowse(
  params?: ListingRequestParameters,
): Promise<PaginatedApiResponse<Listing>> {
  const response = await apiClient.getPaginated<
    Listing,
    ListingRequestParameters
  >("/listings/browse", params);
  return mapPaginatedListings(response);
}

export async function getListingById(
  listingId: string,
): Promise<ApiResponse<Listing>> {
  const response = await apiClient.get<Listing>(`/listings/${listingId}`);
  return {
    ...response,
    data: response.data ? mapListing(response.data) : null,
  };
}

export async function createListing(
  payload: CreateListingRequestDTO,
): Promise<ApiResponse<Listing>> {
  const response = await apiClient.post<Listing>("/listings", payload);
  return {
    ...response,
    data: response.data ? mapListing(response.data) : null,
  };
}

export async function updateListing(
  listingId: string,
  payload: UpdateListingRequestDTO,
): Promise<ApiResponse<Listing>> {
  const response = await apiClient.put<Listing>(
    `/listings/${listingId}`,
    payload,
  );
  return {
    ...response,
    data: response.data ? mapListing(response.data) : null,
  };
}

export async function deleteListing(
  listingId: string,
): Promise<ApiResponse<null>> {
  return apiClient.delete<null>(`/listings/${listingId}`);
}

export async function uploadListingPhoto(
  listingId: string,
  file: File,
): Promise<ApiResponse<ListingPhoto>> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.postFormData<ListingPhoto>(
    `/listings/${listingId}/photos`,
    formData,
  );

  return {
    ...response,
    data: response.data ? mapListingPhoto(response.data) : null,
  };
}

export async function downloadListingPhoto(photoId: string) {
  return apiClient.downloadFile(`/listings/photos/${photoId}/download`);
}

export async function getAdminListings(
  params?: ListingRequestParameters,
): Promise<PaginatedApiResponse<Listing>> {
  const response = await apiClient.getPaginated<
    Listing,
    ListingRequestParameters
  >("/listings", params);
  return mapPaginatedListings(response);
}

export async function moderateListing(
  listingId: string,
  payload: ModerateListingRequestDTO,
): Promise<ApiResponse<null>> {
  return apiClient.patch<null>(`/listings/${listingId}/status`, payload);
}
