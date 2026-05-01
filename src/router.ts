import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
} from "@tanstack/react-router";
import { getAuthUser, isAuthenticated } from "@/auth/session";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppShellLayout } from "@/layouts/AppShellLayout";
import { RootLayout } from "@/layouts/RootLayout";
import { DashboardPage } from "@/pages/app/DashboardPage";
import { ListingsPage } from "@/pages/app/ListingsPage";
import MessagesPage from "@/pages/app/MessagesPage";
import { PaymentsPage } from "@/pages/app/PaymentsPage";
import { VerificationPage } from "@/pages/app/VerificationPage";
import { AdminPage } from "@/pages/app/AdminPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { LandingPage } from "@/pages/LandingPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ListingDetailPage } from "./pages/app/ListingDetailPage";

type AuthSearch = {
  email?: string;
  token?: string;
};

const parseAuthSearch = (search: Record<string, unknown>): AuthSearch => {
  const next: AuthSearch = {};

  if (typeof search.email === "string") {
    next.email = search.email;
  }

  if (typeof search.token === "string") {
    next.token = search.token;
  }

  return next;
};

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: AuthLayout,
});

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/login",
  component: LoginPage,
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/app/dashboard" });
    }
  },
});

const registerRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/register",
  component: RegisterPage,
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/app/dashboard" });
    }
  },
});

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-email",
  component: VerifyEmailPage,
  validateSearch: parseAuthSearch,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/app/dashboard" });
    }
  },
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/reset-password",
  component: ResetPasswordPage,
  validateSearch: parseAuthSearch,
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/app/dashboard" });
    }
  },
});

const resetPasswordCompatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  validateSearch: parseAuthSearch,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/auth/reset-password", search });
  },
});

const appShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: AppShellLayout,
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/auth/login" });
    }
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const listingsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/listings",
  component: ListingsPage,
});

const listingDetailRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/listings/$listingId",
  component: ListingDetailPage,
});

const messagesRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/messages",
  component: MessagesPage,
});

const paymentsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/payments",
  component: PaymentsPage,
});

const verificationRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/verification",
  component: VerificationPage,
});

const adminRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: "/admin",
  component: AdminPage,
  beforeLoad: () => {
    const authUser = getAuthUser();
    const isAdmin = authUser?.roles?.includes("ADMIN") ?? false;

    if (!isAdmin) {
      throw redirect({ to: "/app/dashboard" });
    }
  },
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  verifyEmailRoute,
  resetPasswordCompatRoute,
  authLayoutRoute.addChildren([
    loginRoute,
    registerRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
  ]),
  appShellRoute.addChildren([
    dashboardRoute,
    listingsRoute,
    listingDetailRoute,
    messagesRoute,
    paymentsRoute,
    verificationRoute,
    adminRoute,
  ]),
]);

export const router = createRouter({ routeTree });

// Augment the TanStack Router module with our router type for full type-safety.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
