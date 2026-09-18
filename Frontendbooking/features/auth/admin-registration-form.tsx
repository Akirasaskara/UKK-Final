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
import { useRegisterAdminMutation } from '@/features/auth/hooks';
import {
  registerAdminSchema,
  type RegisterAdminInput,
} from '@/features/auth/schemas';
import { ApiError } from '@/lib/api/errors';

export function AdminRegistrationForm() {
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const mutation = useRegisterAdminMutation();
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm<RegisterAdminInput>({
    resolver: zodResolver(registerAdminSchema),
    defaultValues: {
      username: '',
      password: '',
      nama_coworking: '',
      nama_pemilik: '',
      telp: '',
      alamat: undefined,
      deskripsi_fasilitas: undefined,
    },
  });

  useEffect(() => {
    if (mutation.error) errorSummaryRef.current?.focus();
  }, [mutation.error]);

  async function onSubmit(input: RegisterAdminInput) {
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

      <FormField id="nama_coworking" label="Nama coworking" required error={errors.nama_coworking?.message}>
        <Input
          id="nama_coworking"
          autoComplete="organization"
          aria-invalid={Boolean(errors.nama_coworking)}
          aria-describedby={fieldDescriptionId('nama_coworking', errors.nama_coworking?.message)}
          {...register('nama_coworking')}
        />
      </FormField>

      <FormField id="nama_pemilik" label="Nama pemilik" required error={errors.nama_pemilik?.message}>
        <Input
          id="nama_pemilik"
          autoComplete="name"
          aria-invalid={Boolean(errors.nama_pemilik)}
          aria-describedby={fieldDescriptionId('nama_pemilik', errors.nama_pemilik?.message)}
          {...register('nama_pemilik')}
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

      <FormField id="alamat" label="Alamat coworking" error={errors.alamat?.message}>
        <Textarea
          id="alamat"
          autoComplete="street-address"
          aria-invalid={Boolean(errors.alamat)}
          aria-describedby={fieldDescriptionId('alamat', errors.alamat?.message)}
          {...register('alamat')}
        />
      </FormField>

      <FormField id="deskripsi_fasilitas" label="Deskripsi fasilitas" error={errors.deskripsi_fasilitas?.message}>
        <Textarea
          id="deskripsi_fasilitas"
          aria-invalid={Boolean(errors.deskripsi_fasilitas)}
          aria-describedby={fieldDescriptionId('deskripsi_fasilitas', errors.deskripsi_fasilitas?.message)}
          {...register('deskripsi_fasilitas')}
        />
      </FormField>

      <Button type="submit" pending={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Membuat Akun' : 'Daftar sebagai Pengelola'}
      </Button>
    </form>
  );
}
