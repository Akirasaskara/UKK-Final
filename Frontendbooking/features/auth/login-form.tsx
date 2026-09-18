'use client';

import { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  FormField,
  Input,
  fieldDescriptionId,
} from '@/components/ui/form-field';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PasswordInput } from '@/components/ui/password-input';
import { useLoginMutation } from '@/features/auth/hooks';
import { loginSchema, type LoginInput } from '@/features/auth/schemas';
import { ApiError } from '@/lib/api/errors';

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const mutation = useLoginMutation(returnTo);
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  useEffect(() => {
    if (mutation.error) errorSummaryRef.current?.focus();
  }, [mutation.error]);

  async function onSubmit(input: LoginInput) {
    try {
      await mutation.mutateAsync(input);
    } catch {
      resetField('password');
    }
  }

  const apiError = mutation.error instanceof ApiError ? mutation.error : null;
  const passwordError = errors.password?.message;
  const usernameError = errors.username?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {apiError ? (
        <div ref={errorSummaryRef} tabIndex={-1}>
          <InlineAlert
            title={
              apiError.status === 401
                ? 'Username atau password tidak sesuai.'
                : apiError.message
            }
            variant="danger"
          >
            {apiError.code === 'rate_limited'
              ? `Tunggu${apiError.retryAfterSeconds ? ` ${apiError.retryAfterSeconds} detik` : ''} sebelum mencoba kembali.`
              : null}
          </InlineAlert>
        </div>
      ) : null}

      <FormField
        id="username"
        label="Username"
        required
        error={usernameError}
      >
        <Input
          id="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(usernameError)}
          aria-describedby={fieldDescriptionId('username', usernameError)}
          {...register('username')}
        />
      </FormField>

      <FormField
        id="password"
        label="Password"
        required
        error={passwordError}
      >
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={Boolean(passwordError)}
          aria-describedby={fieldDescriptionId('password', passwordError)}
          {...register('password')}
        />
      </FormField>

      <Button type="submit" pending={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Memeriksa Akun' : 'Masuk'}
      </Button>
    </form>
  );
}
