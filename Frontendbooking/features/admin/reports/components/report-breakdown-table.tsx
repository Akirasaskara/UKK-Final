import type { ReportTypeBreakdownItem } from '../schemas';
import { formatIdr } from '@/lib/format/currency';

type ReportBreakdownTableProps = {
  items: ReportTypeBreakdownItem[];
};

export function ReportBreakdownTable({ items }: ReportBreakdownTableProps) {
  const sumBookings = items.reduce((acc, curr) => acc + curr.total_booking, 0);
  const sumHours = items.reduce((acc, curr) => acc + curr.total_jam, 0);
  const sumRevenue = items.reduce((acc, curr) => acc + curr.total_pendapatan, 0);

  return (
    <section
      aria-label="Tabel Rincian Kategori Ruangan"
      className="rounded-card border border-border-default bg-bg-surface shadow-card overflow-hidden print:border-none print:shadow-none"
    >
      <div className="p-5 sm:p-6 border-b border-border-default">
        <h2 className="font-ui text-base font-bold text-text-primary">
          Tabel Rincian per Kategori Ruang Kerja
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Tabel data ekuivalen grafik untuk audit pemesanan, jam, dan nilai transaksi.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <caption className="sr-only">Tabel Rekapitulasi Rincian Kategori Ruang Kerja</caption>
          <thead>
            <tr className="border-b border-border-default bg-bg-subtle text-text-muted">
              <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Kategori Ruang</th>
              <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Tipe Identifier</th>
              <th scope="col" className="p-3.5 font-bold uppercase tracking-wider text-right">Total Booking</th>
              <th scope="col" className="p-3.5 font-bold uppercase tracking-wider text-right">Total Jam</th>
              <th scope="col" className="p-3.5 font-bold uppercase tracking-wider text-right">Nilai Layanan (IDR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {items.map((row) => (
              <tr key={row.tipe} className="hover:bg-bg-subtle/50 transition-colors">
                <td className="p-3.5 font-semibold text-text-primary text-sm">
                  {row.label}
                </td>
                <td className="p-3.5 font-mono text-text-muted">
                  {row.tipe}
                </td>
                <td className="p-3.5 text-right font-bold text-text-primary tabular-nums">
                  {row.total_booking}
                </td>
                <td className="p-3.5 text-right font-semibold text-text-secondary tabular-nums">
                  {row.total_jam} Jam
                </td>
                <td className="p-3.5 text-right font-bold text-action-primary tabular-nums text-sm">
                  {formatIdr(row.total_pendapatan)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border-default bg-bg-subtle/80 font-bold text-text-primary">
              <td colSpan={2} className="p-3.5 uppercase tracking-wider text-xs">
                Total Akumulasi Periode
              </td>
              <td className="p-3.5 text-right tabular-nums">
                {sumBookings}
              </td>
              <td className="p-3.5 text-right tabular-nums">
                {sumHours} Jam
              </td>
              <td className="p-3.5 text-right tabular-nums text-action-primary text-sm">
                {formatIdr(sumRevenue)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
