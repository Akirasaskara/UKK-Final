import type { ReportTypeBreakdownItem, ReportSeriesItem, ReportGranularity } from '../schemas';
import { formatIdr } from '@/lib/format/currency';

type ReportBreakdownTableProps = {
  typeItems: ReportTypeBreakdownItem[];
  seriesItems: ReportSeriesItem[];
  granularity: ReportGranularity;
};

export function ReportBreakdownTable({
  typeItems,
  seriesItems,
  granularity,
}: ReportBreakdownTableProps) {
  const sumBookings = typeItems.reduce((acc, curr) => acc + curr.total_booking, 0);
  const sumHours = typeItems.reduce((acc, curr) => acc + curr.total_jam, 0);
  const sumRealized = typeItems.reduce(
    (acc, curr) => acc + (curr.realisasi_pendapatan_bersih || curr.total_pendapatan || 0),
    0,
  );

  const granularityLabel =
    granularity === 'day' ? 'Harian' : granularity === 'week' ? 'Mingguan' : 'Bulanan';

  return (
    <div className="space-y-6">
      {/* 1. Tabel Deret Waktu Berkala (Time-Series) */}
      <section
        aria-label={`Tabel Rincian Finansial ${granularityLabel}`}
        className="rounded-card border border-border-default bg-bg-surface shadow-card overflow-hidden print:border-none print:shadow-none"
      >
        <div className="p-5 sm:p-6 border-b border-border-default">
          <h2 className="font-ui text-base font-bold text-text-primary">
            Tabel Deret Waktu Berkala ({granularityLabel})
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Tabel data ekuivalen grafik untuk audit berkala transaksi, durasi, estimasi, dan realisasi pendapatan.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">Tabel Deret Waktu Berkala {granularityLabel}</caption>
            <thead>
              <tr className="border-b border-border-default bg-bg-subtle text-text-muted">
                <th scope="col" className="p-3.5 font-bold uppercase tracking-wider">Periode / Interval</th>
                <th scope="col" className="p-3.5 font-bold uppercase tracking-wider text-right">Reservasi</th>
                <th scope="col" className="p-3.5 font-bold uppercase tracking-wider text-right">Total Jam</th>
                <th scope="col" className="p-3.5 font-bold uppercase tracking-wider text-right">Estimasi Bruto</th>
                <th scope="col" className="p-3.5 font-bold uppercase tracking-wider text-right">Diskon Promo</th>
                <th scope="col" className="p-3.5 font-bold uppercase tracking-wider text-right">Realisasi Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {seriesItems.map((row) => (
                <tr key={row.bucket_start + row.bucket_end} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="p-3.5 font-semibold text-text-primary text-sm">
                    {row.label}
                    <span className="block text-[11px] font-mono text-text-muted font-normal mt-0.5">
                      {row.bucket_start === row.bucket_end ? row.bucket_start : `${row.bucket_start} s/d ${row.bucket_end}`}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-bold text-text-primary tabular-nums">
                    {row.total_transaksi}
                  </td>
                  <td className="p-3.5 text-right font-semibold text-text-secondary tabular-nums">
                    {row.total_jam} Jam
                  </td>
                  <td className="p-3.5 text-right font-mono text-text-secondary tabular-nums">
                    {formatIdr(row.estimasi_pendapatan_kotor)}
                  </td>
                  <td className="p-3.5 text-right font-mono text-status-success-text tabular-nums">
                    {row.total_potongan_diskon > 0 ? `-${formatIdr(row.total_potongan_diskon)}` : 'Rp0'}
                  </td>
                  <td className="p-3.5 text-right font-bold text-action-primary tabular-nums text-sm">
                    {formatIdr(row.realisasi_pendapatan_bersih)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Tabel Rincian per Kategori Ruang */}
      <section
        aria-label="Tabel Rincian Kategori Ruangan"
        className="rounded-card border border-border-default bg-bg-surface shadow-card overflow-hidden print:border-none print:shadow-none"
      >
        <div className="p-5 sm:p-6 border-b border-border-default">
          <h2 className="font-ui text-base font-bold text-text-primary">
            Tabel Rincian per Kategori Ruang Kerja
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Audit rincian performa per kategori workstation, meeting room, dan private office.
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
                <th scope="col" className="p-3.5 font-bold uppercase tracking-wider text-right">Realisasi Nilai Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {typeItems.map((row) => (
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
                    {formatIdr(row.realisasi_pendapatan_bersih || row.total_pendapatan || 0)}
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
                  {formatIdr(sumRealized)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
