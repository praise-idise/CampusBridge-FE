import { Link } from "@tanstack/react-router";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { ArrowRight, Home, MessageCircle, Shield, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function DashboardPage() {
  const { user, isAdmin } = useAuth();

  // Placeholder stats - these would come from API calls in a real app
  const stats = [
    { label: "Active Listings", value: "0", icon: Home, color: "text-primary" },
    { label: "Messages", value: "0", icon: MessageCircle, color: "text-accent-warm" },
    { label: "KYC Status", value: "Pending", icon: Shield, color: "text-warning" },
    { label: "Escrow Held", value: "¥0", icon: DollarSign, color: "text-success" },
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
