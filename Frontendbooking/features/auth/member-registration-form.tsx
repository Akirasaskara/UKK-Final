'use client';

import { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  FormField,
  Input,
  Textarea,
  fieldDescriptionId,
} from '@/components/ui/form-field';
import { InlineAlert } from '@/components/ui/inline-alert';
import { PasswordInput } from '@/components/ui/password-input';
import { useRegisterMemberMutation } from '@/features/auth/hooks';
import {
  registerMemberSchema,
  type RegisterMemberInput,
} from '@/features/auth/schemas';
import { ApiError } from '@/lib/api/errors';

export function MemberRegistrationForm() {
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const mutation = useRegisterMemberMutation();
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm<RegisterMemberInput>({
    resolver: zodResolver(registerMemberSchema),
    defaultValues: {
      username: '',
      password: '',
      nama_member: '',
      instansi: '',
      alamat: '',
      telp: '',
      foto: undefined,
    },
  });

  useEffect(() => {
    if (mutation.error) errorSummaryRef.current?.focus();
  }, [mutation.error]);

  async function onSubmit(input: RegisterMemberInput) {
    try {
      await mutation.mutateAsync(input);
    } catch {
      resetField('password');
    }
  }

  const apiError = mutation.error instanceof ApiError ? mutation.error : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {apiError ? (
        <div ref={errorSummaryRef} tabIndex={-1}>
          <InlineAlert title={apiError.message} variant="danger" />
        </div>
      ) : null}

      <FormField id="username" label="Username" required error={errors.username?.message}>
        <Input
          id="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(errors.username)}
          aria-describedby={fieldDescriptionId('username', errors.username?.message)}
          {...register('username')}
        />
      </FormField>

      <FormField id="password" label="Password" required error={errors.password?.message} helper="Minimal 6 karakter.">
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={fieldDescriptionId('password', errors.password?.message, 'Minimal 6 karakter.')}
          {...register('password')}
        />
      </FormField>

      <FormField id="nama_member" label="Nama lengkap" required error={errors.nama_member?.message}>
        <Input
          id="nama_member"
          autoComplete="name"
          aria-invalid={Boolean(errors.nama_member)}
          aria-describedby={fieldDescriptionId('nama_member', errors.nama_member?.message)}
          {...register('nama_member')}
        />
      </FormField>

      <FormField id="instansi" label="Instansi" required error={errors.instansi?.message}>
        <Input
          id="instansi"
          autoComplete="organization"
          aria-invalid={Boolean(errors.instansi)}
          aria-describedby={fieldDescriptionId('instansi', errors.instansi?.message)}
          {...register('instansi')}
        />
      </FormField>

      <FormField id="telp" label="Nomor telepon" required error={errors.telp?.message}>
        <Input
          id="telp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-invalid={Boolean(errors.telp)}
          aria-describedby={fieldDescriptionId('telp', errors.telp?.message)}
          {...register('telp')}
        />
      </FormField>

      <FormField id="alamat" label="Alamat" required error={errors.alamat?.message}>
        <Textarea
          id="alamat"
          autoComplete="street-address"
          aria-invalid={Boolean(errors.alamat)}
          aria-describedby={fieldDescriptionId('alamat', errors.alamat?.message)}
          {...register('alamat')}
        />
      </FormField>

      <Button type="submit" pending={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Membuat Akun' : 'Daftar sebagai Member'}
      </Button>
    </form>
  );
}
