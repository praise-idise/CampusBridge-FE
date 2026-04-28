import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, Lock, Users, Home, Shield, Zap } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";

const features = [
  {
    title: "Safe Transactions",
    description: "Hold funds securely in escrow. Release only when both parties are satisfied.",
    icon: Lock,
    color: "text-primary",
  },
  {
    title: "Verified Community",
    description: "Student verification and KYC checks ensure you're trading with real people.",
    icon: Shield,
    color: "text-accent-warm",
  },
  {
    title: "Real-Time Chat",
    description: "Message buyers and sellers instantly. No email delays or lost conversations.",
    icon: MessageCircle,
    color: "text-success",
  },
  {
    title: "Campus Housing",
    description: "Find accommodations, roommates, and services specific to your campus.",
    icon: Home,
    color: "text-primary",
  },
  {
    title: "Peer-to-Peer Network",
    description: "Connect directly with other students. No middleman, no hidden fees.",
    icon: Users,
    color: "text-accent-warm",
  },
  {
    title: "Quick Setup",
    description: "Register in minutes. Verify your identity and start trading immediately.",
    icon: Zap,
    color: "text-success",
  },
];

const stats = [
  { label: "Campus Listings", value: "500+" },
  { label: "Verified Users", value: "1000+" },
  { label: "Secure Escrow Transactions", value: "$50k+" },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              CB
            </div>
            <span className="text-lg font-semibold">CampusBridge</span>
          </div>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <Button onClick={() => navigate({ to: "/app/dashboard" })}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate({ to: "/auth/login" })}>
                  Sign In
                </Button>
                <Button onClick={() => navigate({ to: "/auth/register" })}>
                  Join Now
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-accent-warm/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Badge className="mb-4 border-primary/30 bg-primary/10 text-primary">
            Campus Housing Marketplace
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find Your Campus Home
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            Buy, sell, and trade on campus with verified peers. Secure escrow payments.
            Real-time messaging. Student-first trust.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={() => navigate({ to: "/auth/register" })}
              className="bg-primary hover:bg-primary/90"
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate({ to: "/auth/login" })}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-surface/50 py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-primary sm:text-4xl">{stat.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary">
              Why CampusBridge
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Campus trading, redesigned for students
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to buy, sell, and connect safely within your campus community.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-lg border border-border bg-surface/50 p-6 transition-all hover:border-border hover:bg-surface"
                >
                  <Icon className={cn("size-8 mb-4", feature.color)} />
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-border bg-surface/50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Get started in three steps
          </h2>

          <div className="mt-16 space-y-8 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-8">
            {[
              { step: 1, title: "Register & Verify", description: "Create your account and verify your student status with KYC." },
              { step: 2, title: "Find or List", description: "Browse campus listings or create your own. Post accommodations, services, or items." },
              { step: 3, title: "Trade Safely", description: "Message securely, arrange escrow payment, and complete your transaction." },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="flex flex-col items-start gap-4 sm:items-center sm:text-center">
                  <div className="inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to join your campus community?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Thousands of students are already trading safely on CampusBridge.
            Don't miss out on the best campus deals and connections.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={() => navigate({ to: "/auth/register" })}
              className="bg-primary hover:bg-primary/90"
            >
              Create Account
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate({ to: "/auth/login" })}
            >
              Already have an account?
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="inline-flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                CB
              </div>
              <span className="font-semibold">CampusBridge</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CampusBridge. Empowering campus communities.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
