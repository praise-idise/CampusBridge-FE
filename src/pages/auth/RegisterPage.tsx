import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { isApiError } from '@/api/types'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@/components/ui'
import { useAuth } from '@/hooks/use-auth'

const registerSchema = z.object({
    email: z.email('Enter a valid email address.'),
    firstName: z.string().min(1, 'First name is required.').optional().or(z.literal('')),
    lastName: z.string().min(1, 'Last name is required.').optional().or(z.literal('')),
    password: z.string()
        .min(8, 'Password must be at least 8 characters.')
        .regex(/[A-Z]/, 'Password must include an uppercase letter.')
        .regex(/[a-z]/, 'Password must include a lowercase letter.')
        .regex(/[0-9]/, 'Password must include a number.'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterPage() {
    const { register: registerUser } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: '',
            firstName: '',
            lastName: '',
            password: '',
            confirmPassword: '',
        },
    })

    async function onSubmit(values: RegisterFormValues) {
        try {
            await registerUser({
                email: values.email,
                password: values.password,
                firstName: values.firstName || undefined,
                lastName: values.lastName || undefined,
            })
            setSubmittedEmail(values.email)
            setSubmitted(true)
        } catch (error) {
            if (isApiError(error)) {
                if (error.errors?.Email) {
                    setError('email', { message: error.errors.Email[0] })
                } else {
                    setError('root', { message: error.message || 'Unable to create account. Please try again.' })
                }
                return
            }

            setError('root', { message: 'An unexpected error occurred. Please try again.' })
        }
    }

    if (submitted && submittedEmail) {
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
                        <CardTitle>Account Created!</CardTitle>
                        <CardDescription>Your registration was successful.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                            <p className="text-sm font-medium text-foreground mb-2">Verify Your Email</p>
                            <p className="text-sm text-muted-foreground mb-3">
                                We've sent a verification link to:
                            </p>
                            <p className="text-sm font-semibold text-primary break-all">
                                {submittedEmail}
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Check your email (including spam folder) and click the verification link to activate your account. The link expires in 24 hours.
                        </p>
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Didn't receive the email?</p>
                            <a
                                href={`/verify-email?email=${encodeURIComponent(submittedEmail)}`}
                                className="text-primary hover:underline text-sm block"
                            >
                                Resend verification link
                            </a>
                        </div>
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
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>Join your campus community today.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input 
                                    id="firstName" 
                                    placeholder="John" 
                                    error={Boolean(errors.firstName)} 
                                    {...register('firstName')} 
                                />
                                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input 
                                    id="lastName" 
                                    placeholder="Doe" 
                                    error={Boolean(errors.lastName)} 
                                    {...register('lastName')} 
                                />
                                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                            </div>
                        </div>

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
                            <Label htmlFor="password" required>
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min 8 chars, uppercase, lowercase, number"
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
                            {isSubmitting ? 'Creating account...' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/auth/login" className="text-primary hover:underline font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
