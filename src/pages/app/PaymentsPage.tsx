import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export function PaymentsPage() {
    return (
        <main className="min-w-0 space-y-6">
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
                <p className="text-sm text-muted-foreground">Manage secure escrow transactions.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>The payments module is being built.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Check back soon for escrow payment management.</p>
                </CardContent>
            </Card>
        </main>
    );
}
