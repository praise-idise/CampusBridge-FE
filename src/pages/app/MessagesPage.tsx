import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Headset, Send, ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { isApiError } from "@/api/types";
import {
    getConversations,
    getConversationMessages,
    markConversationRead,
    sendMessage,
    startConversation,
} from "@/services/chat.service";
import { createPaymentHold } from "@/services/payments.service";
import { getSupportContact } from "@/services/users.service";
import {
    startChatHub,
    stopChatHub,
    joinConversation,
    leaveConversation,
    sendMessageViaHub,
    markConversationReadViaHub,
    onMessageReceived,
    onConversationRead,
} from "@/services/chat.hub";
import type { Conversation, Message } from "@/api/types";

function formatTime(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const isToday =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();
    if (isToday) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMessageTime(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ConversationItem({
    conv,
    active,
    onClick,
}: {
    conv: Conversation;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={[
                "w-full text-left px-4 py-3 flex gap-3 items-start border-b border-muted transition-colors",
                active
                    ? "bg-(--accent)/10 border-l-4 border-l-accent"
                    : "hover:bg-(--muted)/60",
            ].join(" ")}
        >
            <div className="shrink-0 w-10 h-10 rounded-full bg-(--accent)/20 flex items-center justify-center text-sm font-semibold text-accent">
                {(conv.otherUserName ?? conv.otherUserId ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-medium truncate text-foreground">
                        {conv.otherUserName ?? conv.otherUserId ?? "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                        {formatTime(conv.lastMessageTime ?? conv.updatedAt ?? conv.createdAt)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessagePreview ?? "No messages yet"}
                    </p>
                    {(conv.unreadCount ?? 0) > 0 && (
                        <span className="shrink-0 min-w-5 h-5 text-xs rounded-full bg-accent text-accent-foreground flex items-center justify-center px-1">
                            {conv.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}

function MessageBubble({
    msg,
    isMine,
}: {
    msg: Message;
    isMine: boolean;
}) {
    return (
        <div
            className={[
                "flex w-full",
                isMine ? "justify-end" : "justify-start",
            ].join(" ")}
        >
            <div
                className={[
                    "max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isMine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm",
                ].join(" ")}
            >
                {!isMine && msg.senderName && (
                    <p className="text-xs font-semibold mb-1 text-accent">
                        {msg.senderName}
                    </p>
                )}
                <p className="wrap-break-word">{msg.content}</p>
                <p
                    className={[
                        "text-xs mt-1",
                        isMine
                            ? "text-(--primary-foreground)/70 text-right"
                            : "text-muted-foreground",
                    ].join(" ")}
                >
                    {formatMessageTime(msg.createdAt ?? msg.sentAt)}
                </p>
            </div>
        </div>
    );
}

function ChatPanel({
    conv,
    currentUserId,
    onBack,
}: {
    conv: Conversation;
    currentUserId: string;
    onBack: () => void;
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [hubError, setHubError] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentNote, setPaymentNote] = useState("");
    const [paymentFeedback, setPaymentFeedback] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["messages", conv.id],
        queryFn: () => getConversationMessages(conv.id, { pageSize: 100 }),
    });

    const createPaymentMutation = useMutation({
        mutationFn: () =>
            createPaymentHold({
                listingId: conv.listingId,
                payeeUserId: conv.otherUserId ?? "",
                amount: Number(paymentAmount),
                note: paymentNote.trim() || undefined,
            }),
        onSuccess: () => {
            setPaymentFeedback("Escrow hold created. You can monitor it from Payments.");
            setPaymentNote("");
            queryClient.invalidateQueries({ queryKey: ["payments"] });
        },
        onError: (error) => {
            setPaymentFeedback(isApiError(error) ? error.message : "Failed to create escrow hold.");
        },
    });

    useEffect(() => {
        if (data?.data) {
            setMessages(data.data);
        }
    }, [data]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        markConversationReadViaHub(conv.id)
            .catch(async () => {
                await markConversationRead(conv.id);
            })
            .then(() => {
                queryClient.setQueryData(["conversations"], (prev: unknown) => {
                    const current = prev as { data?: Conversation[] } | undefined;
                    if (!current?.data) return prev;

                    return {
                        ...current,
                        data: current.data.map((item) =>
                            item.id === conv.id ? { ...item, unreadCount: 0 } : item,
                        ),
                    };
                });
                queryClient.invalidateQueries({ queryKey: ["conversations"] });
            })
            .catch(() => { });
        inputRef.current?.focus();
    }, [conv.id, queryClient]);

    async function handleSend() {
        const content = input.trim();
        if (!content || sending) return;
        setInput("");
        setSending(true);
        try {
            await sendMessageViaHub(conv.id, content);
        } catch {
            setHubError(true);
            try {
                const res = await sendMessage(conv.id, { content });
                if (res.data) {
                    const mapped: Message = { ...res.data, isMine: true };
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === mapped.id)) return prev;
                        return [...prev, mapped];
                    });
                }
            } catch {
                setInput(content);
            }
        } finally {
            setSending(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    const displayName = conv.otherUserName ?? conv.otherUserId ?? "Unknown";

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-muted bg-surface shrink-0">
                <button
                    onClick={onBack}
                    className="md:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                    aria-label="Back"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-(--accent)/20 flex items-center justify-center text-sm font-semibold text-accent">
                    {displayName[0].toUpperCase()}
                </div>
                <div>
                    <p className="font-semibold text-sm text-foreground">{displayName}</p>
                    {hubError && (
                        <p className="text-xs text-muted-foreground">Real-time unavailable · using REST</p>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {isLoading && (
                    <div className="flex justify-center py-8">
                        <Spinner />
                    </div>
                )}
                {!isLoading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                        <MessageSquare className="w-10 h-10 opacity-30" />
                        <p className="text-sm">No messages yet. Say hi!</p>
                    </div>
                )}
                {messages.map((msg) => {
                    const isMine =
                        msg.isMine ??
                        (msg.senderId === currentUserId || msg.senderUserId === currentUserId);
                    return <MessageBubble key={msg.id} msg={msg} isMine={isMine} />;
                })}
                <div ref={bottomRef} />
            </div>

            <div className="shrink-0 border-t border-muted bg-surface px-4 py-3">
                {conv.otherUserId && (
                    <div className="mx-auto mb-3 max-w-4xl rounded-lg border border-border bg-muted/20 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">Create Escrow Payment</p>
                            {conv.listingId && <p className="text-xs text-muted-foreground">Linked to this listing</p>}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                            <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={paymentAmount}
                                onChange={(event) => setPaymentAmount(event.target.value)}
                                placeholder="Amount"
                            />
                            <Input
                                value={paymentNote}
                                onChange={(event) => setPaymentNote(event.target.value)}
                                placeholder="Optional escrow note"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => createPaymentMutation.mutate()}
                                disabled={createPaymentMutation.isPending || Number(paymentAmount) <= 0}
                            >
                                {createPaymentMutation.isPending ? "Creating..." : "Hold in Escrow"}
                            </Button>
                        </div>
                        {paymentFeedback && <p className="mt-2 text-xs text-muted-foreground">{paymentFeedback}</p>}
                    </div>
                )}
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={sending}
                        autoComplete="off"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={sending || !input.trim()}
                        size="sm"
                        className="gap-1.5 px-4"
                    >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Send</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const currentUserId = user?.userId ?? "";
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [mobileView, setMobileView] = useState<"list" | "chat">("list");
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : true,
    );

    const { data: convsData, isLoading: convsLoading } = useQuery({
        queryKey: ["conversations"],
        queryFn: () => getConversations({ pageSize: 50 }),
        refetchInterval: 10000,
        refetchIntervalInBackground: false,
    });

    const conversations = convsData?.data ?? [];

    const contactSupportMutation = useMutation({
        mutationFn: async () => {
            const contactResponse = await getSupportContact();
            if (!contactResponse.data) throw new Error("Support contact unavailable.");
            const adminId = contactResponse.data.userId;
            const existing = conversations.find(
                (c) => c.otherUserId === adminId || c.participantIds?.includes(adminId),
            );
            if (existing) return existing.id;
            const convResponse = await startConversation({ targetUserId: adminId, initialMessage: "Hello, I need help." });
            if (!convResponse.data) throw new Error("Could not start support conversation.");
            return convResponse.data.id ?? (convResponse.data as { conversationId?: string }).conversationId ?? "";
        },
        onSuccess: (conversationId) => {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            setSelectedId(conversationId);
            setMobileView("chat");
        },
    });

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(min-width: 768px)");
        const onChange = (event: MediaQueryListEvent) => {
            setIsDesktop(event.matches);
        };

        setIsDesktop(mediaQuery.matches);
        mediaQuery.addEventListener("change", onChange);

        return () => {
            mediaQuery.removeEventListener("change", onChange);
        };
    }, []);

    useEffect(() => {
        const pendingConversationId = sessionStorage.getItem("campusbridge:open-conversation");
        if (pendingConversationId && conversations.some((conversation) => conversation.id === pendingConversationId)) {
            setSelectedId(pendingConversationId);
            setMobileView("chat");
            sessionStorage.removeItem("campusbridge:open-conversation");
            return;
        }

        if (!selectedId && conversations.length > 0) {
            setSelectedId(conversations[0].id);
            return;
        }

        if (selectedId && conversations.length > 0 && !conversations.some((conversation) => conversation.id === selectedId)) {
            setSelectedId(conversations[0].id);
        }
    }, [conversations, selectedId]);

    useEffect(() => {
        startChatHub().catch(() => {
            console.warn("SignalR hub connection failed — falling back to REST");
        });
        return () => {
            stopChatHub().catch(() => { });
        };
    }, []);

    useEffect(() => {
        if (!conversations.length) return;

        const ids = conversations.map((conversation) => conversation.id);
        ids.forEach((id) => {
            joinConversation(id).catch(() => { });
        });

        return () => {
            ids.forEach((id) => {
                leaveConversation(id).catch(() => { });
            });
        };
    }, [conversations]);

    useEffect(() => {
        const offMessage = onMessageReceived((raw) => {
            const incoming = raw as Message;
            if (!incoming?.conversationId) return;

            const mapped: Message = {
                ...incoming,
                id: incoming.id ?? incoming.messageId ?? crypto.randomUUID(),
                senderId: incoming.senderId ?? incoming.senderUserId ?? "",
                senderUserId: incoming.senderUserId ?? incoming.senderId,
                createdAt: incoming.createdAt ?? incoming.sentAt,
                isMine: (incoming.senderId ?? incoming.senderUserId) === currentUserId,
            };

            queryClient.setQueryData(["messages", mapped.conversationId], (prev: unknown) => {
                const current = prev as { data?: Message[] } | undefined;
                if (!current?.data) return prev;
                if (current.data.some((item) => item.id === mapped.id)) return prev;

                return {
                    ...current,
                    data: [...current.data, mapped],
                };
            });

            queryClient.setQueryData(["conversations"], (prev: unknown) => {
                const current = prev as { data?: Conversation[] } | undefined;
                if (!current?.data) return prev;

                const activeConversationId = selectedId;

                const updated = current.data.map((conversation) => {
                    if (conversation.id !== mapped.conversationId) return conversation;

                    const isActiveConversation =
                        activeConversationId === conversation.id && (isDesktop || mobileView === "chat");
                    const nextUnread = mapped.isMine || isActiveConversation
                        ? 0
                        : (conversation.unreadCount ?? 0) + 1;

                    return {
                        ...conversation,
                        unreadCount: nextUnread,
                        lastMessagePreview: mapped.content,
                        lastMessageAt: mapped.createdAt ?? mapped.sentAt,
                        lastMessageTime: mapped.createdAt ?? mapped.sentAt,
                    };
                });

                return {
                    ...current,
                    data: updated.sort((a, b) => {
                        const aTime = new Date(a.lastMessageAt ?? a.updatedAt ?? a.createdAt).getTime();
                        const bTime = new Date(b.lastMessageAt ?? b.updatedAt ?? b.createdAt).getTime();
                        return bTime - aTime;
                    }),
                };
            });
        });

        const offRead = onConversationRead((payload) => {
            const data = payload as { conversationId?: string; readerUserId?: string };
            if (!data?.conversationId || data.readerUserId !== currentUserId) return;

            queryClient.setQueryData(["conversations"], (prev: unknown) => {
                const current = prev as { data?: Conversation[] } | undefined;
                if (!current?.data) return prev;

                return {
                    ...current,
                    data: current.data.map((conversation) =>
                        conversation.id === data.conversationId
                            ? { ...conversation, unreadCount: 0 }
                            : conversation,
                    ),
                };
            });
        });

        return () => {
            offMessage();
            offRead();
        };
    }, [currentUserId, queryClient, selectedId, mobileView, isDesktop]);

    const selectedConv = conversations.find((c) => c.id === selectedId) ?? null;

    const handleSelectConv = useCallback((id: string) => {
        setSelectedId(id);
        setMobileView("chat");
    }, []);

    const handleBack = useCallback(() => {
        setMobileView("list");
    }, []);

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border border-muted bg-surface">
            <aside
                className={[
                    "flex flex-col border-r border-muted bg-surface shrink-0",
                    "w-full md:w-72 lg:w-80",
                    mobileView === "chat" ? "hidden md:flex" : "flex",
                ].join(" ")}
            >
                <div className="px-4 py-4 border-b border-muted">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-semibold text-foreground">Messages</h1>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => contactSupportMutation.mutate()}
                            disabled={contactSupportMutation.isPending}
                            title="Contact Support"
                        >
                            <Headset className="size-3.5 mr-1" />
                            Support
                        </Button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {convsLoading && (
                        <div className="flex justify-center py-8">
                            <Spinner />
                        </div>
                    )}
                    {!convsLoading && conversations.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full gap-2 py-16 text-muted-foreground">
                            <MessageSquare className="w-10 h-10 opacity-30" />
                            <p className="text-sm">No conversations yet.</p>
                        </div>
                    )}
                    {conversations.map((conv) => (
                        <ConversationItem
                            key={conv.id}
                            conv={conv}
                            active={conv.id === selectedId}
                            onClick={() => handleSelectConv(conv.id)}
                        />
                    ))}
                </div>
            </aside>

            <main
                className={[
                    "flex-1 overflow-hidden",
                    mobileView === "list" ? "hidden md:flex md:flex-col" : "flex flex-col",
                ].join(" ")}
            >
                {selectedConv && (isDesktop || mobileView === "chat") ? (
                    <ChatPanel
                        key={selectedConv.id}
                        conv={selectedConv}
                        currentUserId={currentUserId}
                        onBack={handleBack}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                        <MessageSquare className="w-14 h-14 opacity-20" />
                        <p className="text-base font-medium">Select a conversation</p>
                        <p className="text-sm">Choose a chat from the list to get started.</p>
                    </div>
                )}
            </main>
        </div>
    );
}