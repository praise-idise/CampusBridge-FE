import { apiClient } from "@/api/client";
import type {
  ApiResponse,
  CreatePaymentHoldRequestDTO,
  PaginatedApiResponse,
  Payment,
  PaymentActionRequestDTO,
  PaymentRequestParameters,
  PaymentSummaryDTO,
} from "@/api/types";

function mapPayment(input: Payment): Payment {
  const id = input.id ?? input.paymentId ?? "";
  return {
    ...input,
    id,
    paymentId: input.paymentId ?? id,
    payerId: input.payerId ?? input.payerUserId ?? "",
    payerUserId: input.payerUserId ?? input.payerId,
    payeeId: input.payeeId ?? input.payeeUserId ?? "",
    payeeUserId: input.payeeUserId ?? input.payeeId,
  };
}

export async function getPayments(
  params?: PaymentRequestParameters,
): Promise<PaginatedApiResponse<Payment>> {
  const response = await apiClient.getPaginated<
    Payment,
    PaymentRequestParameters
  >("/payments", params);

  return {
    ...response,
    data: (response.data ?? []).map(mapPayment),
  };
}

export async function getPaymentById(
  paymentId: string,
): Promise<ApiResponse<Payment>> {
  const response = await apiClient.get<Payment>(`/payments/${paymentId}`);

  return {
    ...response,
    data: response.data ? mapPayment(response.data) : null,
  };
}

export async function createPaymentHold(
  payload: CreatePaymentHoldRequestDTO,
): Promise<ApiResponse<Payment>> {
  const response = await apiClient.post<Payment>("/payments/hold", payload);

  return {
    ...response,
    data: response.data ? mapPayment(response.data) : null,
  };
}

export async function releasePayment(
  paymentId: string,
  payload: PaymentActionRequestDTO,
): Promise<ApiResponse<Payment>> {
  const response = await apiClient.post<Payment>(
    `/payments/${paymentId}/release`,
    payload,
  );

  return {
    ...response,
    data: response.data ? mapPayment(response.data) : null,
  };
}

export async function disputePayment(
  paymentId: string,
  payload: PaymentActionRequestDTO,
): Promise<ApiResponse<Payment>> {
  const response = await apiClient.post<Payment>(
    `/payments/${paymentId}/dispute`,
    payload,
  );

  return {
    ...response,
    data: response.data ? mapPayment(response.data) : null,
  };
}

export async function refundPayment(
  paymentId: string,
  payload: PaymentActionRequestDTO,
): Promise<ApiResponse<Payment>> {
  const response = await apiClient.post<Payment>(
    `/payments/${paymentId}/refund`,
    payload,
  );

  return {
    ...response,
    data: response.data ? mapPayment(response.data) : null,
  };
}

export async function getPaymentSummary(): Promise<
  ApiResponse<PaymentSummaryDTO>
> {
  return apiClient.get<PaymentSummaryDTO>("/payments/summary");
}
