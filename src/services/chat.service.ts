import { apiClient } from "@/api/client";
import type {
  ApiResponse,
  Conversation,
  ConversationRequestParameters,
  Message,
  MessageRequestParameters,
  PaginatedApiResponse,
  SendMessageRequestDTO,
  StartConversationRequestDTO,
} from "@/api/types";

function mapConversation(input: Conversation): Conversation {
  const id = input.id ?? input.conversationId ?? "";
  return {
    ...input,
    id,
    conversationId: input.conversationId ?? id,
    lastMessageTime: input.lastMessageTime ?? input.lastMessageAt,
    createdAt:
      input.createdAt ?? input.lastMessageAt ?? new Date().toISOString(),
  };
}

function mapMessage(input: Message): Message {
  const id = input.id ?? input.messageId ?? "";
  return {
    ...input,
    id,
    messageId: input.messageId ?? id,
    senderId: input.senderId ?? input.senderUserId ?? "",
    senderUserId: input.senderUserId ?? input.senderId,
    createdAt: input.createdAt ?? input.sentAt,
  };
}

export async function getConversations(
  params?: ConversationRequestParameters,
): Promise<PaginatedApiResponse<Conversation>> {
  const response = await apiClient.getPaginated<
    Conversation,
    ConversationRequestParameters
  >("/chat/conversations", params);

  return {
    ...response,
    data: (response.data ?? []).map(mapConversation),
  };
}

export async function startConversation(
  payload: StartConversationRequestDTO,
): Promise<ApiResponse<Conversation>> {
  const response = await apiClient.post<Conversation>(
    "/chat/conversations",
    payload,
  );

  return {
    ...response,
    data: response.data ? mapConversation(response.data) : null,
  };
}

export async function getConversationMessages(
  conversationId: string,
  params?: MessageRequestParameters,
): Promise<PaginatedApiResponse<Message>> {
  const response = await apiClient.getPaginated<
    Message,
    MessageRequestParameters
  >(`/chat/conversations/${conversationId}/messages`, params);

  return {
    ...response,
    data: (response.data ?? []).map(mapMessage),
  };
}

export async function sendMessage(
  conversationId: string,
  payload: SendMessageRequestDTO,
): Promise<ApiResponse<Message>> {
  const response = await apiClient.post<Message>(
    `/chat/conversations/${conversationId}/messages`,
    payload,
  );

  return {
    ...response,
    data: response.data ? mapMessage(response.data) : null,
  };
}

export async function markConversationRead(
  conversationId: string,
): Promise<ApiResponse<null>> {
  return apiClient.post<null>(
    `/chat/conversations/${conversationId}/mark-read`,
    {},
  );
}
