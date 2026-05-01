import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useSearch } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { isApiError } from '@/api/types'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { resetPassword } from '@/services/auth.service'

const resetPasswordSchema = z.object({
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters.')
        .regex(/[A-Z]/, 'Password must include an uppercase letter.')
        .regex(/[a-z]/, 'Password must include a lowercase letter.')
        .regex(/[0-9]/, 'Password must include a number.'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
    const search = useSearch({ from: '/auth/reset-password' })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
    })

    const hasRequiredParams = search.email && search.token

    async function onSubmit(values: ResetPasswordFormValues) {
        if (!search.email || !search.token) {
            setError('root', { message: 'Invalid or missing reset link.' })
            return
        }

        try {
            await resetPassword({
                email: search.email,
                token: search.token,
                newPassword: values.newPassword,
            })
            setSubmitted(true)
        } catch (error) {
            if (isApiError(error)) {
                setError('root', { message: error.message || 'Unable to reset password. The link may have expired.' })
                return
            }

            setError('root', { message: 'An unexpected error occurred. Please try again.' })
        }
    }

    if (!hasRequiredParams) {
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
                        <CardTitle>Invalid Link</CardTitle>
                        <CardDescription>The password reset link is invalid or expired.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Please request a new password reset link.
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                            <Link to="/auth/forgot-password">
                                Request new link
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

    if (submitted) {
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
                        <CardTitle>Password Reset</CardTitle>
                        <CardDescription>Your password has been reset successfully.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            You can now sign in with your new password.
                        </p>
                        <Button className="w-full" asChild>
                            <Link to="/auth/login">
                                Go to sign in
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
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
                    <CardTitle>Create New Password</CardTitle>
                    <CardDescription>Set a new password for your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword" required>
                                New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min 8 chars, uppercase, lowercase, number"
                                    error={Boolean(errors.newPassword)}
                                    className="pr-10"
                                    {...register('newPassword')}
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
                            {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" required>
                                Confirm Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Re-enter your password"
                                    error={Boolean(errors.confirmPassword)}
                                    className="pr-10"
                                    {...register('confirmPassword')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((value) => !value)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                        </div>

                        {errors.root?.message && <p className="text-sm text-destructive">{errors.root.message}</p>}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Resetting password...' : 'Reset Password'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <Link to="/auth/login" className="text-primary hover:underline">
                            Back to sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
