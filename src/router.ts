import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
} from "@tanstack/react-router";
import { isAuthenticated } from "@/auth/session";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppShellLayout } from "@/layouts/AppShellLayout";
import { RootLayout } from "@/layouts/RootLayout";
import { DashboardPage } from "@/pages/app/DashboardPage";
import { ListingsPage } from "@/pages/app/ListingsPage";
import { MessagesPage } from "@/pages/app/MessagesPage";
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
  validateSearch: (search) => ({
    email: typeof search.email === 'string' ? search.email : undefined,
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
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
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/app/dashboard" });
    }
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
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  verifyEmailRoute,
  authLayoutRoute.addChildren([
    loginRoute,
    registerRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
  ]),
  appShellRoute.addChildren([
    dashboardRoute,
    listingsRoute,
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
