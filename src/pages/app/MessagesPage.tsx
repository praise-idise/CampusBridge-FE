import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export function MessagesPage() {
    return (
        <main className="min-w-0 space-y-6">
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
                <p className="text-sm text-muted-foreground">Real-time messaging with campus peers.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>The messaging module is being built.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Check back soon for real-time chat.</p>
                </CardContent>
            </Card>
        </main>
    );
}
