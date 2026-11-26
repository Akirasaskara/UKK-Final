'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  MapPin,
  User,
  RefreshCw,
  Search,
  AlertTriangle,
} from 'lucide-react';

interface WorkspaceItem {
  id: number;
  nama_coworking: string;
  nama_pemilik: string;
  telp: string;
  alamat: string | null;
  deskripsi_fasilitas: string | null;
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
  user: {
    id: number;
    username: string;
    created_at: string;
  };
  total_spaces: number;
  total_reservations: number;
}

export default function SuperadminWorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  async function fetchWorkspaces() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/superadmin/workspaces');
      if (!res.ok) {
        throw new Error('Gagal memuat daftar pengajuan workspace.');
      }
      const json = await res.json();
      setWorkspaces(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  async function handleUpdateStatus(id: number, status: 'approved' | 'rejected') {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/superadmin/workspaces/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        throw new Error(errorJson?.message || 'Gagal memperbarui status pengajuan.');
      }

      setWorkspaces((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status } : w)),
      );
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status.');
    } finally {
      setActionLoadingId(null);
    }
  }

  const filteredWorkspaces = workspaces.filter((item) => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch =
      searchTerm.trim() === '' ||
      item.nama_coworking.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama_pemilik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.alamat && item.alamat.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const totalPending = workspaces.filter((w) => w.status === 'pending').length;
  const totalApproved = workspaces.filter((w) => w.status === 'approved').length;
  const totalRejected = workspaces.filter((w) => w.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Building2 className="text-action-primary" size={28} />
            Persetujuan Pendaftaran Workspace
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Panel verifikasi dan persetujuan pengajuan lokasi coworking space baru dari calon mitra pengelola.
          </p>
        </div>
        <button
          onClick={fetchWorkspaces}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-control border border-border-default hover:bg-bg-subtle text-text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterStatus('all')}
          className={`cursor-pointer p-4 rounded-lg border transition-all ${
            filterStatus === 'all'
              ? 'border-action-primary bg-action-primary/5 ring-1 ring-action-primary'
              : 'border-border-default bg-bg-surface hover:border-border-muted'
          }`}
        >
          <p className="text-xs font-semibold text-text-muted uppercase">Total Pengajuan</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{workspaces.length}</p>
        </div>

        <div
          onClick={() => setFilterStatus('pending')}
          className={`cursor-pointer p-4 rounded-lg border transition-all ${
            filterStatus === 'pending'
              ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
              : 'border-border-default bg-bg-surface hover:border-border-muted'
          }`}
        >
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1">
            <Clock size={14} /> Menunggu Persetujuan
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{totalPending}</p>
        </div>

        <div
          onClick={() => setFilterStatus('approved')}
          className={`cursor-pointer p-4 rounded-lg border transition-all ${
            filterStatus === 'approved'
              ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
              : 'border-border-default bg-bg-surface hover:border-border-muted'
          }`}
        >
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1">
            <CheckCircle size={14} /> Disetujui
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalApproved}</p>
        </div>

        <div
          onClick={() => setFilterStatus('rejected')}
          className={`cursor-pointer p-4 rounded-lg border transition-all ${
            filterStatus === 'rejected'
              ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-500'
              : 'border-border-default bg-bg-surface hover:border-border-muted'
          }`}
        >
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase flex items-center gap-1">
            <XCircle size={14} /> Ditolak
          </p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{totalRejected}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama space, pemilik, atau username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-bg-surface border border-border-default rounded-control text-text-primary focus:outline-none focus:ring-2 focus:ring-action-primary"
          />
        </div>
        <div className="flex gap-1.5 p-1 bg-bg-surface border border-border-default rounded-control self-start">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              filterStatus === 'all'
                ? 'bg-action-primary text-text-on-brand'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Menunggu ({totalPending})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              filterStatus === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Disetujui
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              filterStatus === 'rejected'
                ? 'bg-rose-600 text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Ditolak
          </button>
        </div>
      </div>

      {/* Workspace List */}
      {error ? (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 text-sm flex items-center gap-2">
          <AlertTriangle size={18} />
          {error}
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-text-muted text-sm flex flex-col items-center gap-2">
          <RefreshCw size={24} className="animate-spin text-action-primary" />
          Memuat data pengajuan...
        </div>
      ) : filteredWorkspaces.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border-default rounded-lg text-text-muted text-sm">
          Tidak ada data pengajuan workspace yang sesuai dengan filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWorkspaces.map((item) => {
            const isPending = item.status === 'pending';
            const isApproved = item.status === 'approved';
            const isRejected = item.status === 'rejected';
            const isActing = actionLoadingId === item.id;

            return (
              <div
                key={item.id}
                className="p-5 rounded-lg border border-border-default bg-bg-surface hover:shadow-sm transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left Column: Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-lg font-bold text-text-primary">
                        {item.nama_coworking}
                      </h2>
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <Clock size={12} /> Menunggu Verifikasi
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          <CheckCircle size={12} /> Terverifikasi & Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                          <XCircle size={12} /> Ditolak
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-xs text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-text-muted shrink-0" />
                        <span>Pemilik: <strong className="text-text-primary">{item.nama_pemilik}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-text-muted shrink-0" />
                        <span>Kontak: <strong className="text-text-primary">{item.telp}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-text-muted shrink-0" />
                        <span>Daftar: {new Date(item.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                      </div>
                      {item.alamat ? (
                        <div className="flex items-start gap-1.5 sm:col-span-2 md:col-span-3">
                          <MapPin size={14} className="text-text-muted shrink-0 mt-0.5" />
                          <span>Alamat: {item.alamat}</span>
                        </div>
                      ) : null}
                    </div>

                    {item.deskripsi_fasilitas ? (
                      <div className="p-3 rounded bg-bg-subtle text-xs text-text-secondary leading-relaxed border border-border-default/60">
                        <strong className="text-text-primary font-semibold">Fasilitas yang Diajukan:</strong> {item.deskripsi_fasilitas}
                      </div>
                    ) : null}

                    <div className="flex items-center gap-4 text-xs text-text-muted pt-1">
                      <span>Akun Login: <code className="bg-bg-subtle px-1.5 py-0.5 rounded text-text-primary">@{item.user.username}</code></span>
                      <span>Total Ruangan Terdaftar: <strong className="text-text-primary">{item.total_spaces} space</strong></span>
                    </div>
                  </div>

                  {/* Right Column: Approval Action Buttons */}
                  <div className="flex lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border-default">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'approved')}
                          disabled={isActing}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-control bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={15} />
                          {isActing ? 'Memproses...' : 'Setujui Workspace'}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'rejected')}
                          disabled={isActing}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-control bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50"
                        >
                          <XCircle size={15} />
                          {isActing ? 'Memproses...' : 'Tolak Pengajuan'}
                        </button>
                      </>
                    ) : isApproved ? (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'rejected')}
                        disabled={isActing}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-control border border-rose-500/40 text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        Nonaktifkan / Cabut Izin
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'approved')}
                        disabled={isActing}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-control border border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={14} />
                        Pulihkan & Setujui
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
