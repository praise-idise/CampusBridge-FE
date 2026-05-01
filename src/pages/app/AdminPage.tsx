import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, DollarSign, LayoutList, ShieldCheck, ShieldEllipsis, Users } from "lucide-react";
import {
    isApiError,
    KYC_STATUS,
    KYC_STATUS_LABELS,
    LISTING_STATUS,
    LISTING_STATUS_LABELS,
    LISTING_TYPE_LABELS,
    PAYMENT_STATUS,
    PAYMENT_STATUS_LABELS,
    type ApplicationUser,
    type Listing,
    type Payment,
} from "@/api/types";
import { getPayments, getPaymentSummary, refundPayment } from "@/services/payments.service";
import { getAdminListings, moderateListing } from "@/services/listings.service";
import { deleteUser, getUsers, suspendUser, unsuspendUser, updateUserKycStatus } from "@/services/users.service";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from "@/components/ui";

const PAGE_SIZE = 12;

type AdminTab = "users" | "listings" | "payments";

// ── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
    const queryClient = useQueryClient();
    const [pageNumber, setPageNumber] = useState(1);
    const [searchText, setSearchText] = useState("");
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [rejectionReasonByUser, setRejectionReasonByUser] = useState<Record<string, string>>({});

    const usersQuery = useQuery({
        queryKey: ["admin-users", pageNumber],
        queryFn: () => getUsers({ pageNumber, pageSize: PAGE_SIZE }),
    });

    const users: ApplicationUser[] = usersQuery.data?.data ?? [];

    const filteredUsers = useMemo(() => {
        const lower = searchText.toLowerCase();
        if (!lower) return users;
        return users.filter((user) => {
            const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim().toLowerCase();
            return (
                user.email.toLowerCase().includes(lower) ||
                fullName.includes(lower) ||
                user.id.toLowerCase().includes(lower)
            );
        });
    }, [searchText, users]);

    const updateKycMutation = useMutation({
        mutationFn: ({ userId, status, reason }: { userId: string; status: KYC_STATUS; reason?: string }) =>
            updateUserKycStatus(userId, { status, reason }),
        onSuccess: (response) => {
            setFeedbackMessage(response.message || "KYC status updated.");
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        },
        onError: (error) => {
            setFeedbackMessage(isApiError(error) ? error.message : "Failed to update KYC status.");
        },
    });

    const suspendMutation = useMutation({
        mutationFn: (userId: string) => suspendUser(userId),
        onSuccess: (_, userId) => {
            setFeedbackMessage("User suspended.");
            queryClient.setQueryData(["admin-users", pageNumber], (prev: { data?: ApplicationUser[] } | undefined) => {
                if (!prev) return prev;
                return { ...prev, data: prev.data?.map((u: ApplicationUser) => u.id === userId ? { ...u, isActive: false } : u) };
            });
        },
        onError: (error) => setFeedbackMessage(isApiError(error) ? error.message : "Failed to suspend user."),
    });

    const unsuspendMutation = useMutation({
        mutationFn: (userId: string) => unsuspendUser(userId),
        onSuccess: (_, userId) => {
            setFeedbackMessage("User unsuspended.");
            queryClient.setQueryData(["admin-users", pageNumber], (prev: { data?: ApplicationUser[] } | undefined) => {
                if (!prev) return prev;
                return { ...prev, data: prev.data?.map((u: ApplicationUser) => u.id === userId ? { ...u, isActive: true } : u) };
            });
        },
        onError: (error) => setFeedbackMessage(isApiError(error) ? error.message : "Failed to unsuspend user."),
    });

    const deleteMutation = useMutation({
        mutationFn: (userId: string) => deleteUser(userId),
        onSuccess: () => {
            setFeedbackMessage("User deleted.");
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        },
        onError: (error) => setFeedbackMessage(isApiError(error) ? error.message : "Failed to delete user."),
    });

    function handleKycChange(userId: string, status: KYC_STATUS) {
        const reason = rejectionReasonByUser[userId]?.trim();
        if (status === KYC_STATUS.REJECTED && !reason) {
            setFeedbackMessage("Provide a rejection reason before rejecting a KYC submission.");
            return;
        }
        updateKycMutation.mutate({ userId, status, reason: status === KYC_STATUS.REJECTED ? reason : undefined });
    }

    const isPending = updateKycMutation.isPending || suspendMutation.isPending || unsuspendMutation.isPending || deleteMutation.isPending;

    return (
        <div className="space-y-3">
            <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by email, user id, or name"
            />
            {feedbackMessage && <p className="text-sm text-muted-foreground">{feedbackMessage}</p>}
            {usersQuery.isLoading && <p className="text-sm text-muted-foreground">Loading users...</p>}
            {!usersQuery.isLoading && filteredUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">No users found.</p>
            )}
            <div className="space-y-2">
                {filteredUsers.map((user) => (
                    <div key={user.id} className="rounded-md border border-border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold">{user.email}</p>
                                <p className="text-xs text-muted-foreground">
                                    {user.firstName ?? ""} {user.lastName ?? ""} · {user.id}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={user.isActive ? "success" : "outline"}>{user.isActive ? "Active" : "Suspended"}</Badge>
                                <Badge>{KYC_STATUS_LABELS[user.kycStatus]}</Badge>
                            </div>
                        </div>

                        {user.kycStatus === KYC_STATUS.REJECTED && user.kycRejectionReason && (
                            <p className="mt-2 text-xs text-destructive">Rejection reason sent: {user.kycRejectionReason}</p>
                        )}

                        <div className="mt-3 space-y-1">
                            <Label htmlFor={`reject-reason-${user.id}`}>Rejection Reason</Label>
                            <Textarea
                                id={`reject-reason-${user.id}`}
                                value={rejectionReasonByUser[user.id] ?? user.kycRejectionReason ?? ""}
                                onChange={(e) => setRejectionReasonByUser((prev) => ({ ...prev, [user.id]: e.target.value }))}
                                placeholder="Only required when rejecting KYC"
                            />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {[KYC_STATUS.PENDING, KYC_STATUS.VERIFIED, KYC_STATUS.REJECTED].map((status) => (
                                <Button
                                    key={status}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleKycChange(user.id, status)}
                                    disabled={isPending || user.kycStatus === status}
                                >
                                    Mark {KYC_STATUS_LABELS[status]}
                                </Button>
                            ))}
                            <div className="ml-auto flex gap-2">
                                {user.isActive ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => suspendMutation.mutate(user.id)}
                                        disabled={isPending}
                                    >
                                        Suspend
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => unsuspendMutation.mutate(user.id)}
                                        disabled={isPending}
                                    >
                                        Unsuspend
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                        if (confirm(`Permanently delete ${user.email}? This cannot be undone.`)) {
                                            deleteMutation.mutate(user.id);
                                        }
                                    }}
                                    disabled={isPending}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between pt-2">
                <Button
                    variant="outline"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1 || usersQuery.isFetching}
                >
                    Previous
                </Button>
                <span className="text-xs text-muted-foreground">Page {pageNumber}</span>
                <Button
                    variant="outline"
                    onClick={() => setPageNumber((p) => p + 1)}
                    disabled={usersQuery.isFetching || (usersQuery.data?.pagination.totalPages ?? 1) <= pageNumber}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

// ── Listings Tab ─────────────────────────────────────────────────────────────

function ListingsTab() {
    const queryClient = useQueryClient();
    const [pageNumber, setPageNumber] = useState(1);
    const [searchText, setSearchText] = useState("");
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const listingsQuery = useQuery({
        queryKey: ["admin-listings", pageNumber],
        queryFn: () => getAdminListings({ pageNumber, pageSize: PAGE_SIZE }),
    });

    const listings: Listing[] = listingsQuery.data?.data ?? [];

    const filteredListings = useMemo(() => {
        const lower = searchText.toLowerCase();
        if (!lower) return listings;
        return listings.filter(
            (l) =>
                l.title.toLowerCase().includes(lower) ||
                l.ownerId.toLowerCase().includes(lower) ||
                (l.location ?? "").toLowerCase().includes(lower),
        );
    }, [searchText, listings]);

    const moderateMutation = useMutation({
        mutationFn: ({ listingId, status }: { listingId: string; status: LISTING_STATUS }) =>
            moderateListing(listingId, { status }),
        onSuccess: (_, vars) => {
            setFeedbackMessage(`Listing status updated to ${LISTING_STATUS_LABELS[vars.status]}.`);
            queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
        },
        onError: (error) => setFeedbackMessage(isApiError(error) ? error.message : "Failed to update listing."),
    });

    const statusVariant: Record<LISTING_STATUS, "success" | "outline" | "destructive"> = {
        [LISTING_STATUS.ACTIVE]: "success",
        [LISTING_STATUS.CLOSED]: "outline",
        [LISTING_STATUS.ARCHIVED]: "destructive",
    };

    return (
        <div className="space-y-3">
            <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by title, owner id, or location"
            />
            {feedbackMessage && <p className="text-sm text-muted-foreground">{feedbackMessage}</p>}
            {listingsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading listings...</p>}
            {!listingsQuery.isLoading && filteredListings.length === 0 && (
                <p className="text-sm text-muted-foreground">No listings found.</p>
            )}
            <div className="space-y-2">
                {filteredListings.map((listing) => (
                    <div key={listing.id} className="rounded-md border border-border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold">{listing.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {LISTING_TYPE_LABELS[listing.type]} · ¥{listing.price.toFixed(2)} · Owner: {listing.ownerId}
                                </p>
                            </div>
                            <Badge variant={statusVariant[listing.status]}>{LISTING_STATUS_LABELS[listing.status]}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {[LISTING_STATUS.ACTIVE, LISTING_STATUS.CLOSED, LISTING_STATUS.ARCHIVED].map((status) => (
                                <Button
                                    key={status}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => moderateMutation.mutate({ listingId: listing.id, status })}
                                    disabled={moderateMutation.isPending || listing.status === status}
                                >
                                    {LISTING_STATUS_LABELS[status]}
                                </Button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between pt-2">
                <Button
                    variant="outline"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1 || listingsQuery.isFetching}
                >
                    Previous
                </Button>
                <span className="text-xs text-muted-foreground">Page {pageNumber}</span>
                <Button
                    variant="outline"
                    onClick={() => setPageNumber((p) => p + 1)}
                    disabled={listingsQuery.isFetching || (listingsQuery.data?.pagination.totalPages ?? 1) <= pageNumber}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

// ── Payments Tab ─────────────────────────────────────────────────────────────

function PaymentsTab() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<PAYMENT_STATUS | "ALL">("ALL");
    const [pageNumber, setPageNumber] = useState(1);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const summaryQuery = useQuery({
        queryKey: ["admin-payment-summary"],
        queryFn: getPaymentSummary,
    });

    const summary = summaryQuery.data?.data;

    const paymentsQuery = useQuery({
        queryKey: ["admin-payments", pageNumber, statusFilter],
        queryFn: () =>
            getPayments({
                pageNumber,
                pageSize: PAGE_SIZE,
                status: statusFilter === "ALL" ? undefined : statusFilter,
            }),
    });

    const payments: Payment[] = paymentsQuery.data?.data ?? [];

    const refundMutation = useMutation({
        mutationFn: (paymentId: string) => refundPayment(paymentId, {}),
        onSuccess: () => {
            setFeedbackMessage("Payment refunded.");
            queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
            queryClient.invalidateQueries({ queryKey: ["admin-payment-summary"] });
        },
        onError: (error) => setFeedbackMessage(isApiError(error) ? error.message : "Failed to refund payment."),
    });

    const summaryCards = [
        { label: "Held", count: summary?.heldCount ?? 0, total: summary?.heldTotal ?? 0, status: PAYMENT_STATUS.HELD },
        { label: "Released", count: summary?.releasedCount ?? 0, total: summary?.releasedTotal ?? 0, status: PAYMENT_STATUS.RELEASED },
        { label: "Disputed", count: summary?.disputedCount ?? 0, total: summary?.disputedTotal ?? 0, status: PAYMENT_STATUS.DISPUTED },
        { label: "Refunded", count: summary?.refundedCount ?? 0, total: summary?.refundedTotal ?? 0, status: PAYMENT_STATUS.REFUNDED },
    ];

    const statusVariant: Record<PAYMENT_STATUS, "success" | "outline" | "destructive" | "muted"> = {
        [PAYMENT_STATUS.HELD]: "muted",
        [PAYMENT_STATUS.RELEASED]: "success",
        [PAYMENT_STATUS.DISPUTED]: "destructive",
        [PAYMENT_STATUS.REFUNDED]: "outline",
        [PAYMENT_STATUS.CANCELLED]: "outline",
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                    <button
                        key={card.label}
                        onClick={() => { setStatusFilter(card.status); setPageNumber(1); }}
                        className={[
                            "rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                            statusFilter === card.status ? "border-primary bg-muted/50" : "border-border",
                        ].join(" ")}
                    >
                        <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                        <p className="text-xl font-bold">{card.count}</p>
                        <p className="text-sm text-muted-foreground">¥{card.total.toFixed(2)}</p>
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant={statusFilter === "ALL" ? "primary" : "outline"}
                    onClick={() => { setStatusFilter("ALL"); setPageNumber(1); }}
                >
                    All
                </Button>
                {Object.values(PAYMENT_STATUS).map((s) => (
                    <Button
                        key={s}
                        size="sm"
                        variant={statusFilter === s ? "primary" : "outline"}
                        onClick={() => { setStatusFilter(s); setPageNumber(1); }}
                    >
                        {PAYMENT_STATUS_LABELS[s]}
                    </Button>
                ))}
            </div>

            {feedbackMessage && <p className="text-sm text-muted-foreground">{feedbackMessage}</p>}
            {paymentsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading payments...</p>}
            {!paymentsQuery.isLoading && payments.length === 0 && (
                <p className="text-sm text-muted-foreground">No payments found.</p>
            )}

            <div className="space-y-2">
                {payments.map((payment) => (
                    <div key={payment.id} className="rounded-md border border-border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold">¥{payment.amount.toFixed(2)} {payment.currency}</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(payment.createdAt).toLocaleDateString()} · Payer: {payment.payerId} → Payee: {payment.payeeId}
                                </p>
                                {payment.note && <p className="text-xs text-muted-foreground mt-0.5">{payment.note}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={statusVariant[payment.status]}>{PAYMENT_STATUS_LABELS[payment.status]}</Badge>
                                {payment.status === PAYMENT_STATUS.DISPUTED && (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                            if (confirm("Refund this payment?")) refundMutation.mutate(payment.id);
                                        }}
                                        disabled={refundMutation.isPending}
                                    >
                                        Refund
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between pt-2">
                <Button
                    variant="outline"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1 || paymentsQuery.isFetching}
                >
                    Previous
                </Button>
                <span className="text-xs text-muted-foreground">Page {pageNumber}</span>
                <Button
                    variant="outline"
                    onClick={() => setPageNumber((p) => p + 1)}
                    disabled={paymentsQuery.isFetching || (paymentsQuery.data?.pagination.totalPages ?? 1) <= pageNumber}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

// ── Admin Overview Summary ────────────────────────────────────────────────────

export function AdminPage({ embedded = false }: { embedded?: boolean }) {
    const [activeTab, setActiveTab] = useState<AdminTab>("users");

    const adminOverviewQuery = useQuery({
        queryKey: ["admin-overview"],
        queryFn: async () => {
            const [usersResponse, heldPaymentsResponse] = await Promise.all([
                getUsers({ pageNumber: 1, pageSize: 100 }),
                getPayments({ pageNumber: 1, pageSize: 100, status: PAYMENT_STATUS.HELD }),
            ]);
            return {
                totalUsers: usersResponse.pagination.totalRecords,
                heldPaymentsTotal: heldPaymentsResponse.pagination.totalRecords,
                pendingKycCount: (usersResponse.data ?? []).filter((u) => u.kycStatus === KYC_STATUS.PENDING).length,
                verifiedKycCount: (usersResponse.data ?? []).filter((u) => u.kycStatus === KYC_STATUS.VERIFIED).length,
            };
        },
    });

    const summaryCards = [
        { label: "Total Users", value: String(adminOverviewQuery.data?.totalUsers ?? 0), icon: Users },
        { label: "Pending KYC", value: String(adminOverviewQuery.data?.pendingKycCount ?? 0), icon: ShieldEllipsis },
        { label: "Verified KYC", value: String(adminOverviewQuery.data?.verifiedKycCount ?? 0), icon: ShieldCheck },
        { label: "Held Payments", value: String(adminOverviewQuery.data?.heldPaymentsTotal ?? 0), icon: DollarSign },
    ];

    const tabs: { key: AdminTab; label: string; icon: typeof Users }[] = [
        { key: "users", label: "Users", icon: Users },
        { key: "listings", label: "Listings", icon: LayoutList },
        { key: "payments", label: "Payments", icon: AlertTriangle },
    ];

    return (
        <main className="min-w-0 space-y-6">
            {!embedded && (
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Manage users, listings, and payments.</p>
                </div>
            )}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.label} className="bg-surface/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline justify-between">
                                    <p className="text-2xl font-bold">{card.value}</p>
                                    <Icon className="size-4 text-primary" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </section>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex gap-1 border-b border-border pb-3">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={[
                                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                        activeTab === tab.key
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:text-foreground",
                                    ].join(" ")}
                                >
                                    <Icon className="size-3.5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="pt-1">
                        <CardTitle className="text-base">
                            {activeTab === "users" && "User Management"}
                            {activeTab === "listings" && "Listing Moderation"}
                            {activeTab === "payments" && "Payment Oversight"}
                        </CardTitle>
                        <CardDescription>
                            {activeTab === "users" && "Manage non-admin users, KYC outcomes, and account status."}
                            {activeTab === "listings" && "Review all listings and change their status."}
                            {activeTab === "payments" && "Monitor escrow activity and process refunds for disputed payments."}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {activeTab === "users" && <UsersTab />}
                    {activeTab === "listings" && <ListingsTab />}
                    {activeTab === "payments" && <PaymentsTab />}
                </CardContent>
            </Card>
        </main>
    );
}
