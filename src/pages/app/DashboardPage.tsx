import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { ArrowRight, Home, MessageCircle, Shield, DollarSign } from "lucide-react";
import { KYC_STATUS, KYC_STATUS_LABELS, PAYMENT_STATUS } from "@/api/types";
import { AdminPage } from "@/pages/app/AdminPage";
import { useAuth } from "@/hooks/use-auth";
import { getConversations } from "@/services/chat.service";
import { getKycStatus } from "@/services/kyc.service";
import { getListings } from "@/services/listings.service";
import { getPayments } from "@/services/payments.service";

export function DashboardPage() {
  const { user, isAdmin } = useAuth();

  if (isAdmin) {
    return <AdminPage embedded />;
  }

  const listingsQuery = useQuery({
    queryKey: ["dashboard", "my-listings"],
    queryFn: () => getListings({ pageNumber: 1, pageSize: 1 }),
  });

  const conversationsQuery = useQuery({
    queryKey: ["dashboard", "conversations"],
    queryFn: () => getConversations({ pageNumber: 1, pageSize: 50 }),
  });

  const kycQuery = useQuery({
    queryKey: ["dashboard", "kyc-status"],
    queryFn: getKycStatus,
  });

  const paymentsQuery = useQuery({
    queryKey: ["dashboard", "payments-held"],
    queryFn: () => getPayments({ pageNumber: 1, pageSize: 100, status: PAYMENT_STATUS.HELD }),
  });

  const conversationData = conversationsQuery.data?.data ?? [];
  const unreadCount = conversationData.reduce((sum, conversation) => sum + (conversation.unreadCount ?? 0), 0);
  const escrowHeld = (paymentsQuery.data?.data ?? []).reduce((sum, payment) => sum + payment.amount, 0);

  const stats = [
    {
      label: "My Listings",
      value: String(listingsQuery.data?.pagination?.totalRecords ?? 0),
      icon: Home,
      color: "text-primary",
    },
    {
      label: "Unread Messages",
      value: String(unreadCount),
      icon: MessageCircle,
      color: "text-accent-warm",
    },
    {
      label: "KYC Status",
      value: KYC_STATUS_LABELS[kycQuery.data?.data?.status ?? KYC_STATUS.NONE],
      icon: Shield,
      color: "text-warning",
    },
    {
      label: "Escrow Held",
      value: `¥${escrowHeld.toFixed(2)}`,
      icon: DollarSign,
      color: "text-success",
    },
  ];

  return (
    <main className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to CampusBridge</h1>
        <p className="mt-2 text-muted-foreground">
          {isAdmin ? "Admin Dashboard" : `Connected as ${user?.email || "student"}`}
        </p>
      </div>

      {/* Stats Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-surface/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <Icon className={`size-4 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {isAdmin ? (
            <>
              <Card className="flex items-center justify-between p-6">
                <div>
                  <h3 className="font-semibold">User Management</h3>
                  <p className="text-sm text-muted-foreground">Review and manage users</p>
                </div>
                <Button asChild variant="ghost" size="icon">
                  <Link to="/app/admin">
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </Card>
              <Card className="flex items-center justify-between p-6">
                <div>
                  <h3 className="font-semibold">KYC Review</h3>
                  <p className="text-sm text-muted-foreground">Approve or reject verifications</p>
                </div>
                <Button asChild variant="ghost" size="icon">
                  <Link to="/app/admin">
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </Card>
            </>
          ) : (
            <>
              <Card className="flex items-center justify-between p-6">
                <div>
                  <h3 className="font-semibold">Browse Listings</h3>
                  <p className="text-sm text-muted-foreground">Find campus deals and housing</p>
                </div>
                <Button asChild variant="ghost" size="icon">
                  <Link to="/app/listings">
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </Card>
              <Card className="flex items-center justify-between p-6">
                <div>
                  <h3 className="font-semibold">Messages</h3>
                  <p className="text-sm text-muted-foreground">Chat with buyers and sellers</p>
                </div>
                <Button asChild variant="ghost" size="icon">
                  <Link to="/app/messages">
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </Card>
              <Card className="flex items-center justify-between p-6">
                <div>
                  <h3 className="font-semibold">Verify Your Identity</h3>
                  <p className="text-sm text-muted-foreground">Complete KYC for full access</p>
                </div>
                <Button asChild variant="ghost" size="icon">
                  <Link to="/app/verification">
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </Card>
              <Card className="flex items-center justify-between p-6">
                <div>
                  <h3 className="font-semibold">Payment History</h3>
                  <p className="text-sm text-muted-foreground">Track escrow transactions</p>
                </div>
                <Button asChild variant="ghost" size="icon">
                  <Link to="/app/payments">
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Campus Safety</CardTitle>
          <CardDescription>How we keep transactions secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            ✓ <strong>Verified Users</strong> — All campus members must verify their student status via KYC.
          </p>
          <p>
            ✓ <strong>Escrow Protection</strong> — Funds are held safely until both parties confirm satisfaction.
          </p>
          <p>
            ✓ <strong>Direct Messaging</strong> — Real-time chat keeps all conversations transparent and traceable.
          </p>
          <p>
            ✓ <strong>Dispute Resolution</strong> — Our team helps resolve conflicts fairly.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
