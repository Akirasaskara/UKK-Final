'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FormField, Input, Textarea, fieldDescriptionId } from '@/components/ui/form-field';
import { PasswordInput } from '@/components/ui/password-input';
import { InlineAlert } from '@/components/ui/inline-alert';
import { MemberPhotoUpload } from './member-photo-upload';
import { useCreateMemberAssistedMutation } from '../hooks';
import { createMemberAssistedInputSchema, type CreateMemberAssistedInput } from '../schemas';
import { Info, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function AssistedMemberForm() {
  const createMutation = useCreateMemberAssistedMutation();

  const [stagedFoto, setStagedFoto] = useState<string | null>(null);
  const [createdSuccess, setCreatedSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    resetField,
    reset,
    formState: { errors },
  } = useForm<CreateMemberAssistedInput>({
    resolver: zodResolver(createMemberAssistedInputSchema),
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

  async function onSubmit(values: CreateMemberAssistedInput) {
    setCreatedSuccess(null);
    try {
      await createMutation.mutateAsync({
        ...values,
        foto: stagedFoto,
      });

      setCreatedSuccess(values.nama_member);
      reset();
      setStagedFoto(null);
    } catch {
      resetField('password');
    }
  }

  const isPending = createMutation.isPending;
  const activeError = createMutation.error;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Visibility Notice Banner */}
      <div className="flex items-start gap-2.5 rounded-control border border-border-default bg-bg-surface p-4 text-xs text-text-secondary">
        <Info size={18} className="shrink-0 text-action-secondary mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-semibold text-text-primary">Tentang Pendaftaran Berbantu (Assisted Registration):</p>
          <p className="leading-relaxed text-text-muted">
            Formulir ini membuat akun member global untuk pelanggan. Demi menjaga privasi antar-pengelola, member baru yang didaftarkan <strong>belum akan muncul di tabel daftar member</strong> sampai member tersebut membuat reservasi pertamanya di coworking space Anda.
          </p>
        </div>
      </div>

      {createdSuccess ? (
        <div className="rounded-card border border-status-success-text bg-status-success-bg p-6 space-y-4">
          <div className="flex items-center gap-2 text-status-success-text font-bold text-base">
            <CheckCircle2 size={20} aria-hidden="true" />
            <span>Akun Member {createdSuccess} Berhasil Dibuat!</span>
          </div>
          <p className="text-xs text-text-primary leading-relaxed">
            Kredensial login telah aktif. Pelanggan dapat langsung masuk (login) ke aplikasi member dan memesan ruang kerja. Setelah reservasi pertama dilakukan, profil member akan otomatis muncul dalam daftar pelanggan Anda.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCreatedSuccess(null)}
              className="inline-flex min-h-10 items-center justify-center rounded-control bg-action-primary px-4 py-2 text-xs font-semibold text-text-on-brand hover:bg-action-primary-hover shadow-sm"
            >
              Daftarkan Member Lain
            </button>
            <Link
              href="/admin/members"
              className="text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              Kembali ke Daftar Member
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {activeError ? (
            <InlineAlert title="Pendaftaran Member Gagal" variant="danger">
              <p className="text-xs mt-1">
                {activeError instanceof Error ? activeError.message : 'Terjadi kendala saat mendaftarkan akun member.'}
              </p>
            </InlineAlert>
          ) : null}

          <div className="rounded-card border border-border-default bg-bg-surface p-6 sm:p-8 shadow-card space-y-5">
            <div className="space-y-4 pb-2 border-b border-border-default">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                1. Kredensial Login Member
              </p>

              <FormField id="username" label="Username Unik" required error={errors.username?.message}>
                <Input
                  id="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="Contoh: budi_santoso"
                  aria-invalid={Boolean(errors.username)}
                  aria-describedby={fieldDescriptionId('username', errors.username?.message)}
                  {...register('username')}
                />
              </FormField>

              <FormField id="password" label="Password Akun" required error={errors.password?.message} helper="Gunakan minimal 6 karakter.">
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  placeholder="Buat password sementara"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={fieldDescriptionId('password', errors.password?.message, 'Minimal 6 karakter.')}
                  {...register('password')}
                />
              </FormField>
            </div>

            <div className="space-y-4 pt-1">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                2. Data Identitas & Kontak
              </p>

              <FormField id="nama_member" label="Nama Lengkap" required error={errors.nama_member?.message}>
                <Input
                  id="nama_member"
                  autoComplete="name"
                  placeholder="Nama sesuai identitas"
                  aria-invalid={Boolean(errors.nama_member)}
                  aria-describedby={fieldDescriptionId('nama_member', errors.nama_member?.message)}
                  {...register('nama_member')}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField id="instansi" label="Instansi / Perusahaan" required error={errors.instansi?.message}>
                  <Input
                    id="instansi"
                    autoComplete="organization"
                    placeholder="Nama kantor / universitas"
                    aria-invalid={Boolean(errors.instansi)}
                    aria-describedby={fieldDescriptionId('instansi', errors.instansi?.message)}
                    {...register('instansi')}
                  />
                </FormField>

                <FormField id="telp" label="Nomor Telepon / WhatsApp" required error={errors.telp?.message}>
                  <Input
                    id="telp"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0812xxxxxxxx"
                    aria-invalid={Boolean(errors.telp)}
                    aria-describedby={fieldDescriptionId('telp', errors.telp?.message)}
                    {...register('telp')}
                  />
                </FormField>
              </div>

              <FormField id="alamat" label="Alamat Domisili" required error={errors.alamat?.message}>
                <Textarea
                  id="alamat"
                  autoComplete="street-address"
                  placeholder="Alamat domisili member saat ini..."
                  aria-invalid={Boolean(errors.alamat)}
                  aria-describedby={fieldDescriptionId('alamat', errors.alamat?.message)}
                  {...register('alamat')}
                />
              </FormField>

              <div className="border-t border-border-default pt-4">
                <MemberPhotoUpload
                  onPhotoUploaded={(filename) => setStagedFoto(filename)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/admin/members"
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              Batal & Kembali
            </Link>
            <Button type="submit" pending={isPending} className="min-w-44">
              {isPending ? 'Mendaftarkan Member...' : 'Buat Akun Member'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
