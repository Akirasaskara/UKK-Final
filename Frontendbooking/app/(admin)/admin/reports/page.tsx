import { Suspense } from 'react';
import { AdminReportPageContent } from '@/features/admin/reports/components/report-page-content';
import type { ReportGranularity } from '@/features/admin/reports/schemas';

export const metadata = {
  title: 'Laporan Finansial dan Operasional | Smart Space Booking Admin',
  description: 'Rekapitulasi total reservasi, durasi penggunaan, dan nilai pendapatan layanan coworking space.',
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    granularity?: string | string[];
    from?: string | string[];
    to?: string | string[];
    month?: string | string[];
    year?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  let initialGranularity: ReportGranularity = 'month';
  if (typeof params.granularity === 'string' && ['day', 'week', 'month'].includes(params.granularity)) {
    initialGranularity = params.granularity as ReportGranularity;
  }

  let initialFrom: string;
  let initialTo: string;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (typeof params.from === 'string' && dateRegex.test(params.from) && typeof params.to === 'string' && dateRegex.test(params.to)) {
    initialFrom = params.from;
    initialTo = params.to;
  } else if (typeof params.month === 'string' && /^(?:[1-9]|1[0-2])$/.test(params.month)) {
    const m = Number(params.month);
    const y = typeof params.year === 'string' && /^20\d{2}$/.test(params.year) ? Number(params.year) : currentYear;
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    initialFrom = `${y}-${String(m).padStart(2, '0')}-01`;
    initialTo = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  } else {
    const lastDay = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();
    initialFrom = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    initialTo = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }

  return (
    <Suspense fallback={null}>
      <AdminReportPageContent
        initialGranularity={initialGranularity}
        initialFrom={initialFrom}
        initialTo={initialTo}
      />
    </Suspense>
  );
}
