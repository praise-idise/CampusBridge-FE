import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { verifyEmail, resendVerification } from '@/services/auth.service'
import { isApiError } from '@/api/types'

export function VerifyEmailPage() {
    const { email, token } = useSearch({ from: '/verify-email' })

    const navigate = useNavigate()
    const hasRequestedVerification = useRef(false)

    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resending' | 'ready-to-resend'>('loading')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        if (email && !token) {
            setStatus('ready-to-resend')
            setErrorMessage(null)
            return
        }

        if (!email || !token) {
            setStatus('error')
            setErrorMessage('Invalid or missing verification link.')
            return
        }

        if (hasRequestedVerification.current) {
            return
        }

        hasRequestedVerification.current = true

        verifyEmail(email, token)
            .then(() => {
                setStatus('success')
            })
            .catch((error) => {
                if (isApiError(error)) {
                    if (error.statusCode === 409 &&
                        error.message === 'Email is already verified') {
                        setStatus('success')
                        setErrorMessage(null)
                        return
                    }

                    setErrorMessage(error.message || 'Email verification failed.')
                } else {
                    setErrorMessage('An unexpected error occurred.')
                }
                setStatus('error')
            })
    }, [email, token])

    async function handleResendVerification() {
        if (!email) return
        setStatus('resending')
        try {
            await resendVerification({ email })
            setStatus('ready-to-resend')
            setErrorMessage('New verification link sent to your email.')
        } catch (error) {
            setErrorMessage(isApiError(error) ? error.message : 'Failed to resend verification email.')
            setStatus('ready-to-resend')
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md border-primary/20">
                    <CardHeader>
                        <div className="mb-4 flex items-center gap-2">
                            <div className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                                CB
                            </div>
                            <span className="text-lg font-semibold">CampusBridge</span>
                        </div>
                        <CardTitle>Verifying Email</CardTitle>
                        <CardDescription>Please wait while we verify your email address...</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Loader className="size-8 text-primary animate-spin" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md border-primary/20">
                    <CardHeader>
                        <div className="mb-4 flex items-center gap-2">
                            <div className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                                CB
                            </div>
                            <span className="text-lg font-semibold">CampusBridge</span>
                        </div>
                        <div className="mb-4 flex justify-center">
                            <CheckCircle className="size-12 text-success" />
                        </div>
                        <CardTitle>Email Verified!</CardTitle>
                        <CardDescription>Your email has been successfully verified.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Your account is now fully activated. Sign in to start using CampusBridge.
                        </p>
                        <Button className="w-full" onClick={() => navigate({ to: '/auth/login' })}>
                            Go to Sign In
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const isResendMode = status === 'ready-to-resend' || status === 'resending'

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border-primary/20">
                <CardHeader>
                    <div className="mb-4 flex items-center gap-2">
                        <div className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                            CB
                        </div>
                        <span className="text-lg font-semibold">CampusBridge</span>
                    </div>
                    <div className="mb-4 flex justify-center">
                        <AlertCircle className="size-12 text-destructive" />
                    </div>
                    <CardTitle>{isResendMode ? 'Resend Verification Email' : 'Verification Failed'}</CardTitle>
                    <CardDescription>
                        {isResendMode ? "We'll send a fresh verification link to your email address." : "We couldn't verify your email address."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {isResendMode
                            ? errorMessage || 'Your previous link may have expired. Request a new one below.'
                            : errorMessage || 'The verification link may have expired or is invalid.'}
                    </p>
                    {email && isResendMode && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleResendVerification}
                            disabled={status === 'resending'}
                        >
                            {status === 'resending' ? 'Sending...' : `Resend link to ${email}`}
                        </Button>
                    )}
                    <Button variant="ghost" className="w-full" asChild>
                        <Link to="/auth/register">
                            Create new account
                        </Link>
                    </Button>
                    <Link to="/auth/login" className="block text-center text-sm text-primary hover:underline">
                        Back to sign in
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}
