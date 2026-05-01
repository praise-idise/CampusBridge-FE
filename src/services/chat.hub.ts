import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { getAccessToken } from "@/auth/session";

function resolveHubUrl(): string {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!apiBaseUrl) {
    return "/hubs/chat";
  }

  try {
    const url = new URL(apiBaseUrl);
    url.pathname = "/hubs/chat";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return `${apiBaseUrl.replace(/\/api\/v\d+\/?$/, "")}/hubs/chat`;
  }
}

const HUB_URL = resolveHubUrl();

let connection: HubConnection | null = null;
const messageHandlers = new Set<(msg: unknown) => void>();
const conversationReadHandlers = new Set<(payload: unknown) => void>();
let subscriberCount = 0;
let startPromise: Promise<void> | null = null;
let stopTimer: number | null = null;

function buildConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => getAccessToken() ?? "",
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

export async function startChatHub(): Promise<void> {
  subscriberCount += 1;

  if (stopTimer !== null) {
    window.clearTimeout(stopTimer);
    stopTimer = null;
  }

  if (connection?.state === HubConnectionState.Connected) {
    return;
  }

  if (startPromise) {
    await startPromise;
    return;
  }

  if (!connection) {
    connection = buildConnection();

    connection.on("message_received", (msg: unknown) => {
      messageHandlers.forEach((handler) => handler(msg));
    });

    connection.on("conversation_read", (payload: unknown) => {
      conversationReadHandlers.forEach((handler) => handler(payload));
    });

    connection.onclose(() => {
      startPromise = null;
    });
  }

  startPromise = connection.start();

  try {
    await startPromise;
  } finally {
    startPromise = null;
  }
}

export async function stopChatHub(): Promise<void> {
  subscriberCount = Math.max(0, subscriberCount - 1);

  if (subscriberCount > 0) {
    return;
  }

  if (stopTimer !== null) {
    window.clearTimeout(stopTimer);
  }

  stopTimer = window.setTimeout(async () => {
    if (subscriberCount > 0 || !connection) {
      return;
    }

    const current = connection;
    connection = null;

    if (current.state !== HubConnectionState.Disconnected) {
      await current.stop();
    }
  }, 300);
}

export async function joinConversation(conversationId: string): Promise<void> {
  if (!connection || connection.state !== HubConnectionState.Connected) return;
  await connection.invoke("JoinConversation", conversationId);
}

export async function leaveConversation(conversationId: string): Promise<void> {
  if (!connection || connection.state !== HubConnectionState.Connected) return;
  await connection.invoke("LeaveConversation", conversationId);
}

export async function sendMessageViaHub(
  conversationId: string,
  content: string,
): Promise<void> {
  if (!connection || connection.state !== HubConnectionState.Connected) {
    throw new Error("Hub not connected");
  }
  await connection.invoke("SendMessage", conversationId, content);
}

export async function markConversationReadViaHub(
  conversationId: string,
): Promise<void> {
  if (!connection || connection.state !== HubConnectionState.Connected) {
    throw new Error("Hub not connected");
  }
  await connection.invoke("MarkConversationRead", conversationId);
}

export function onMessageReceived(handler: (msg: unknown) => void): () => void {
  messageHandlers.add(handler);
  return () => {
    messageHandlers.delete(handler);
  };
}

export function onConversationRead(
  handler: (payload: unknown) => void,
): () => void {
  conversationReadHandlers.add(handler);
  return () => {
    conversationReadHandlers.delete(handler);
  };
}

export function isHubConnected(): boolean {
  return connection?.state === HubConnectionState.Connected;
}
