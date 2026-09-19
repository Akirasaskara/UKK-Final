import { AdminReportPageContent } from '@/features/admin/reports/components/report-page-content';

export const metadata = {
  title: 'Laporan Finansial & Rekapitulasi — Smart Space Booking Admin',
  description: 'Rekapitulasi total reservasi, durasi penggunaan, dan nilai pendapatan layanan coworking space.',
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[]; year?: string | string[] }>;
}) {
  const { month, year } = await searchParams;

  const now = new Date();
  const initialMonth = typeof month === 'string' && /^[1-9]|1[0-2]$/.test(month)
    ? Number.parseInt(month, 10)
    : now.getMonth() + 1;

  const initialYear = typeof year === 'string' && /^20\d{2}$/.test(year)
    ? Number.parseInt(year, 10)
    : now.getFullYear();

  return (
    <div>
      <AdminReportPageContent initialMonth={initialMonth} initialYear={initialYear} />
    </div>
  );
}
