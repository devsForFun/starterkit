'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { resetPassword } from '@/app/actions/auth';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';

// Stronger password validation schema to match registration requirements
const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
      .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[\W_]/, { message: 'Password must contain at least one special character' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isValidToken, setIsValidToken] = useState(true);
  const [passwordReset, setPasswordReset] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Check if the URL has a valid password reset token
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (type !== 'recovery' || !accessToken) {
      setIsValidToken(false);
      toast.error('Invalid or expired password reset link. Please request a new one.');
    }
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await resetPassword(values.password);

      if (response.error) {
        toast.error(response.error);
        form.setError('root', { message: response.error });
        return;
      }

      toast.success('Password reset successful! Redirecting to login...');
      setPasswordReset(true);

      // Clear form for security
      form.reset();

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  }

  if (!isValidToken) {
    return (
      <div className="flex h-screen w-full items-center justify-center px-4">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a new password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/forgot-password')} className="w-full">
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Choose a strong password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel htmlFor="password">New Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          id="password"
                          placeholder="********"
                          autoComplete="new-password"
                          disabled={form.formState.isSubmitting || passwordReset}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          id="confirmPassword"
                          placeholder="********"
                          autoComplete="new-password"
                          disabled={form.formState.isSubmitting || passwordReset}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className={`w-full ${passwordReset ? 'bg-green-500 hover:bg-green-600' : ''}`}
                  disabled={form.formState.isSubmitting || passwordReset}
                >
                  {passwordReset ? 'Password Reset!' : form.formState.isSubmitting ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
