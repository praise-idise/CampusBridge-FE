import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export function VerificationPage() {
    return (
        <main className="min-w-0 space-y-6">
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">Student Verification</h1>
                <p className="text-sm text-muted-foreground">Complete your KYC verification to unlock all features.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                    <CardDescription>The verification module is being built.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Check back soon to verify your student status.</p>
                </CardContent>
            </Card>
        </main>
    );
}
