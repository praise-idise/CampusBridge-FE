import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { isApiError } from '@/api/types'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { forgotPassword } from '@/services/auth.service'

const forgotPasswordSchema = z.object({
    email: z.email('Enter a valid email address.'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
    const [submitted, setSubmitted] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        watch,
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    })

    const email = watch('email')

    async function onSubmit(values: ForgotPasswordFormValues) {
        try {
            await forgotPassword(values)
            setSubmitted(true)
        } catch (error) {
            if (isApiError(error)) {
                setError('root', { message: error.message || 'Unable to process request. Please try again.' })
                return
            }

            setError('root', { message: 'An unexpected error occurred. Please try again.' })
        }
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
                        <CardTitle>Check Your Email</CardTitle>
                        <CardDescription>Password reset instructions sent</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            We've sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the link to create a new password.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            If you don't see the email, check your spam folder or try again.
                        </p>
                        <Button variant="outline" className="w-full" onClick={() => setSubmitted(false)}>
                            Back to forgot password
                        </Button>
                        <Link to="/auth/login" className="block text-center text-sm text-primary hover:underline">
                            Back to sign in
                        </Link>
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
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>Enter your email to receive a password reset link.</CardDescription>
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

                        {errors.root?.message && <p className="text-sm text-destructive">{errors.root.message}</p>}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending link...' : 'Send Reset Link'}
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
