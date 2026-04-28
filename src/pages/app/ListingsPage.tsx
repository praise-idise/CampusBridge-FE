import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export function ListingsPage() {
    return (
        <main className="min-w-0 space-y-6">
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">Listings</h1>
                <p className="text-sm text-muted-foreground">Browse and manage campus listings.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>The listings module is being built.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Check back soon for the full marketplace experience.</p>
                </CardContent>
            </Card>
        </main>
    );
}
