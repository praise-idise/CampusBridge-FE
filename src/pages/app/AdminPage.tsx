import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export function AdminPage() {
    return (
        <main className="min-w-0 space-y-6">
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage users and review KYC verification requests.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>The admin module is being built.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Check back soon for admin management tools.</p>
                </CardContent>
            </Card>
        </main>
    );
}
