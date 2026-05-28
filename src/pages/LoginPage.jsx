import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNotification, Button, Card, CardBody, FormField, Input } from '@aviary-ui/ui';
import { storage } from '@aviary-ui/core';
import { config } from '@/infra/config';
import { login } from '@/api/auth';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }) => {
    try {
      const data = await login(email, password);
      storage.setToken(data.token);
      if (data.refresh_token) storage.setRefreshToken(data.refresh_token);
      storage.setUser(data.user ?? {});
      navigate('/dashboard');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 justify-content-center align-items-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <h1 className="fw-bold fs-1 mb-1">{config.appName}</h1>
        </div>

        <Card className="card-md shadow-sm">
          <CardBody>
            <h2 className="h3 text-center mb-4">Sign in to your account</h2>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormField label="Email address" htmlFor="email" error={errors.email?.message}>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </FormField>
              <FormField label="Password" htmlFor="password" error={errors.password?.message}>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  autoComplete="current-password"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </FormField>
              <div className="form-footer">
                <Button type="submit" loading={isSubmitting} className="w-100">
                  {isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="text-center text-secondary mt-3 small">
          &copy; {new Date().getFullYear()} {config.appName}
        </div>
      </div>
    </div>
  );
}
