// ═══════════════════════════════════════════════════════════════
// Core API Envelopes & Response Structures
// ═══════════════════════════════════════════════════════════════

/** Standard envelope for all non-paginated API responses. */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
}

/** Pagination metadata returned alongside list responses. */
export interface Pagination {
  currentPage?: number;
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

/** Standard envelope for paginated list responses. */
export interface PaginatedApiResponse<T> extends Omit<
  ApiResponse<T[]>,
  "data"
> {
  data: T[] | null;
  pagination: Pagination;
}

/** Shape of error responses from the API. */
export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  /** Field-level validation errors keyed by property name. */
  errors?: Record<string, string[]>;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "success" in error &&
    (error as ApiError).success === false
  );
}

// ═══════════════════════════════════════════════════════════════
// Auth Domain Types
// ═══════════════════════════════════════════════════════════════

export interface LoginResponseDTO {
  token?: string | null;
  expiresAt: string;
  userId?: string | null;
  email?: string | null;
  roles?: string[] | null;
}

export interface RegisterDTO {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  email: string;
  token: string;
  newPassword: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export interface ResendVerificationDTO {
  email: string;
}

// ═══════════════════════════════════════════════════════════════
// Listing Domain Types
// ═══════════════════════════════════════════════════════════════

export enum LISTING_TYPE {
  ACCOMMODATION = 1,
  ROOMMATE = 2,
  MARKETPLACE = 3,
  MONEY_EXCHANGE = 4,
  SERVICE = 5,
  OTHER = 6,
}

export enum LISTING_STATUS {
  DRAFT = 0,
  ACTIVE = 1,
  CLOSED = 2,
  ARCHIVED = 3,
}

export const LISTING_TYPE_LABELS: Record<LISTING_TYPE, string> = {
  [LISTING_TYPE.ACCOMMODATION]: "Accommodation",
  [LISTING_TYPE.ROOMMATE]: "Roommate",
  [LISTING_TYPE.MARKETPLACE]: "Marketplace",
  [LISTING_TYPE.MONEY_EXCHANGE]: "Money Exchange",
  [LISTING_TYPE.SERVICE]: "Service",
  [LISTING_TYPE.OTHER]: "Other",
};

export const LISTING_STATUS_LABELS: Record<LISTING_STATUS, string> = {
  [LISTING_STATUS.DRAFT]: "Draft",
  [LISTING_STATUS.ACTIVE]: "Active",
  [LISTING_STATUS.CLOSED]: "Closed",
  [LISTING_STATUS.ARCHIVED]: "Archived",
};

export interface ListingPhoto {
  id: string;
  listingId: string;
  url?: string;
  uploadedAt: string;
}

export interface Listing {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  price: number;
  location?: string;
  type: LISTING_TYPE;
  status: LISTING_STATUS;
  photos?: ListingPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingRequestDTO {
  title: string;
  description: string;
  price: number;
  location?: string;
  type: LISTING_TYPE;
}

export interface UpdateListingRequestDTO {
  title: string;
  description: string;
  price: number;
  location?: string;
  type: LISTING_TYPE;
  status: LISTING_STATUS;
}

export interface ListingRequestParameters {
  pageNumber?: number;
  pageSize?: number;
  type?: LISTING_TYPE;
  search?: string;
}

// ═══════════════════════════════════════════════════════════════
// Chat Domain Types
// ═══════════════════════════════════════════════════════════════

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderEmail?: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessageTime?: string;
  isClosed: boolean;
  listingId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StartConversationRequestDTO {
  targetUserId: string;
  listingId?: string;
  initialMessage?: string;
}

export interface SendMessageRequestDTO {
  content: string;
}

export interface ConversationRequestParameters {
  pageNumber?: number;
  pageSize?: number;
}

export interface MessageRequestParameters {
  pageNumber?: number;
  pageSize?: number;
}

// ═══════════════════════════════════════════════════════════════
// Payment Domain Types
// ═══════════════════════════════════════════════════════════════

export enum PAYMENT_STATUS {
  HELD = 1,
  RELEASED = 2,
  DISPUTED = 3,
  REFUNDED = 4,
  CANCELLED = 5,
}

export const PAYMENT_STATUS_LABELS: Record<PAYMENT_STATUS, string> = {
  [PAYMENT_STATUS.HELD]: "Held",
  [PAYMENT_STATUS.RELEASED]: "Released",
  [PAYMENT_STATUS.DISPUTED]: "Disputed",
  [PAYMENT_STATUS.REFUNDED]: "Refunded",
  [PAYMENT_STATUS.CANCELLED]: "Cancelled",
};

export interface Payment {
  id: string;
  payerId: string;
  payeeId: string;
  amount: number;
  currency: string;
  status: PAYMENT_STATUS;
  listingId?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentHoldRequestDTO {
  listingId?: string;
  payeeUserId: string;
  amount: number;
  currency?: string;
  note?: string;
}

export interface PaymentActionRequestDTO {
  note?: string;
}

export interface PaymentRequestParameters {
  pageNumber?: number;
  pageSize?: number;
  status?: PAYMENT_STATUS;
}

// ═══════════════════════════════════════════════════════════════
// KYC Domain Types
// ═══════════════════════════════════════════════════════════════

export enum KYC_STATUS {
  NONE = 0,
  PENDING = 1,
  VERIFIED = 2,
  REJECTED = 3,
}

export const KYC_STATUS_LABELS: Record<KYC_STATUS, string> = {
  [KYC_STATUS.NONE]: "Not Started",
  [KYC_STATUS.PENDING]: "Pending Review",
  [KYC_STATUS.VERIFIED]: "Verified",
  [KYC_STATUS.REJECTED]: "Rejected",
};

export interface KycDocument {
  id: string;
  userId: string;
  documentType: string;
  status: KYC_STATUS;
  uploadedAt: string;
  reviewedAt?: string;
}

export interface UploadIdRequestDTO {
  file: File;
}

// ═══════════════════════════════════════════════════════════════
// User Domain Types (Admin)
// ═══════════════════════════════════════════════════════════════

export enum ROLE_TYPE {
  ADMIN = 1,
  USER = 2,
}

export interface ApplicationUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  kycStatus: KYC_STATUS;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  roles?: string[];
}

export interface UpdateUserKycStatusRequestDTO {
  status: KYC_STATUS;
}

export interface UserRequestParameters {
  pageNumber?: number;
  pageSize?: number;
}
