import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    PAYMENT_STATUS,
    PAYMENT_STATUS_OPTIONS,
    PAYMENT_STATUS_LABELS,
    isApiError,
    type Payment,
    type PaymentActionRequestDTO,
} from "@/api/types";
import {
    disputePayment,
    getPayments,
    refundPayment,
    releasePayment,
} from "@/services/payments.service";
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Input,
} from "@/components/ui";

const PAGE_SIZE = 10;

export function PaymentsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<PAYMENT_STATUS | "">("");
    const [pageNumber, setPageNumber] = useState(1);
    const [actionNote, setActionNote] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const paymentsQuery = useQuery({
        queryKey: ["payments", statusFilter, pageNumber],
        queryFn: () =>
            getPayments({
                pageNumber,
                pageSize: PAGE_SIZE,
                status: statusFilter || undefined,
            }),
    });

    const actionMutation = useMutation({
        mutationFn: async (args: { paymentId: string; action: "release" | "dispute" | "refund" }) => {
            const payload: PaymentActionRequestDTO = { note: actionNote.trim() || undefined };

            if (args.action === "release") return releasePayment(args.paymentId, payload);
            if (args.action === "dispute") return disputePayment(args.paymentId, payload);
            return refundPayment(args.paymentId, payload);
        },
        onSuccess: () => {
            setErrorMessage(null);
            queryClient.invalidateQueries({ queryKey: ["payments"] });
        },
        onError: (error) => {
            setErrorMessage(isApiError(error) ? error.message : "Payment action failed.");
        },
    });

    const payments: Payment[] = paymentsQuery.data?.data ?? [];
    const pagination = paymentsQuery.data?.pagination;

    function runAction(paymentId: string, action: "release" | "dispute" | "refund") {
        actionMutation.mutate({ paymentId, action });
    }

    return (
        <main className="min-w-0 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
                <p className="text-sm text-muted-foreground">Track escrow status and perform payment actions.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payment Filters</CardTitle>
                    <CardDescription>Filter records by status and apply actions with an audit note.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-[220px_1fr]">
                    <select
                        className="h-10 w-full rounded-md border border-input bg-surface px-3 text-sm"
                        value={statusFilter}
                        onChange={(event) => {
                            const value = event.target.value;
                            setStatusFilter(value ? (value as PAYMENT_STATUS) : "");
                            setPageNumber(1);
                        }}
                    >
                        <option value="">All Statuses</option>
                        {PAYMENT_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                                {PAYMENT_STATUS_LABELS[status]}
                            </option>
                        ))}
                    </select>
                    <Input
                        value={actionNote}
                        onChange={(event) => setActionNote(event.target.value)}
                        placeholder="Optional action note for release/dispute/refund"
                    />
                    {errorMessage && <p className="text-sm text-destructive md:col-span-2">{errorMessage}</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payment Records</CardTitle>
                    <CardDescription>
                        {pagination
                            ? `Page ${pagination.pageNumber} of ${pagination.totalPages} (${pagination.totalRecords} total)`
                            : "Recent transactions"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {paymentsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading payments...</p>}
                    {!paymentsQuery.isLoading && payments.length === 0 && <p className="text-sm text-muted-foreground">No payments found.</p>}

                    {payments.map((payment) => (
                        <div key={payment.id} className="rounded-md border border-border p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold">Payment #{payment.id.slice(0, 8)}</p>
                                    <p className="text-xs text-muted-foreground">Payer: {payment.payerId} | Payee: {payment.payeeId}</p>
                                </div>
                                <div className="text-right">
                                    <Badge>{PAYMENT_STATUS_LABELS[payment.status]}</Badge>
                                    <p className="mt-1 text-sm font-semibold">
                                        {payment.amount.toFixed(2)} {payment.currency}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => runAction(payment.id, "release")}
                                    disabled={actionMutation.isPending || payment.status !== PAYMENT_STATUS.HELD}
                                >
                                    Release
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => runAction(payment.id, "dispute")}
                                    disabled={actionMutation.isPending || payment.status !== PAYMENT_STATUS.HELD}
                                >
                                    Dispute
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => runAction(payment.id, "refund")}
                                    disabled={actionMutation.isPending || payment.status === PAYMENT_STATUS.REFUNDED}
                                >
                                    Refund
                                </Button>
                            </div>
                            {payment.note && <p className="mt-2 text-xs text-muted-foreground">Note: {payment.note}</p>}
                        </div>
                    ))}

                    {pagination && (
                        <div className="flex items-center justify-between pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                                disabled={pageNumber <= 1 || paymentsQuery.isFetching}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setPageNumber((prev) => prev + 1)}
                                disabled={pagination.pageNumber >= pagination.totalPages || paymentsQuery.isFetching}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
