import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { isApiError } from '@/api/types'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { useAuth } from '@/hooks/use-auth'
import { resendVerification } from '@/services/auth.service'

const loginSchema = z.object({
    email: z.email('Enter a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    // Track if the error is specifically about unverified email, plus the email used
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(values: LoginFormValues) {
        setUnverifiedEmail(null)
        setResendStatus('idle')
        try {
            await login(values)
            navigate({ to: '/app/dashboard' })
        } catch (error) {
            if (isApiError(error)) {
                // Detect the unverified-email case so we can offer resend
                const isUnverified = error.statusCode === 401 &&
                    error.message.toLowerCase().includes('not verified')
                if (isUnverified) {
                    setUnverifiedEmail(values.email)
                }
                setError('root', { message: error.message })
                return
            }
            setError('root', { message: 'An unexpected error occurred. Please try again.' })
        }
    }

    async function handleResend() {
        if (!unverifiedEmail) return
        setResendStatus('sending')
        try {
            await resendVerification({ email: unverifiedEmail })
            setResendStatus('sent')
        } catch {
            setResendStatus('idle')
        }
    }

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
                    <CardTitle>Sign In</CardTitle>
                    <CardDescription>Welcome back to your campus community.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" required>
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@campus.edu"
                                error={Boolean(errors.email)}
                                {...register('email')}
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" required>
                                    Password
                                </Label>
                                <Link
                                    to="/auth/forgot-password"
                                    className="text-xs text-primary hover:underline"
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    error={Boolean(errors.password)}
                                    className="pr-10"
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                        </div>

                        {errors.root?.message && (
                            <div className="space-y-2">
                                <p className="text-sm text-destructive">{errors.root.message}</p>
                                {unverifiedEmail && (
                                    <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
                                        {resendStatus === 'sent' ? (
                                            <p className="text-foreground">
                                                Verification link sent — check your inbox (and spam folder).
                                            </p>
                                        ) : (
                                            <p className="text-muted-foreground">
                                                Need a new verification link?{' '}
                                                <button
                                                    type="button"
                                                    onClick={handleResend}
                                                    disabled={resendStatus === 'sending'}
                                                    className="font-medium text-primary hover:underline disabled:opacity-60"
                                                >
                                                    {resendStatus === 'sending' ? 'Sending...' : 'Resend it'}
                                                </button>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-muted-foreground">
                            Don't have an account?{' '}
                            <Link to="/auth/register" className="text-primary hover:underline font-medium">
                                Create one
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
