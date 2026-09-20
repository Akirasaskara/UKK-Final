'use client';

const monthNames = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

type HistoryPeriodFilterProps = {
  month: number;
  year: number;
  onPeriodChange: (month: number, year: number) => void;
};

export function HistoryPeriodFilter({
  month,
  year,
  onPeriodChange,
}: HistoryPeriodFilterProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1997 }, (_, index) => currentYear + 2 - index);

  return (
    <section
      aria-labelledby="history-filter-title"
      className="border-y border-border-default bg-bg-surface py-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="history-filter-title" className="font-ui text-base font-bold text-text-primary">
            Periode transaksi
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Pilih bulan untuk melihat reservasi dan pengeluaran pada periode tersebut.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
          <div>
            <label htmlFor="history-month" className="mb-1.5 block text-xs font-semibold text-text-secondary">
              Bulan
            </label>
            <select
              id="history-month"
              value={month}
              onChange={(event) => onPeriodChange(Number(event.target.value), year)}
              className="min-h-11 w-full rounded-control border border-border-default bg-bg-canvas px-3 text-sm font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] sm:w-40"
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="history-year" className="mb-1.5 block text-xs font-semibold text-text-secondary">
              Tahun
            </label>
            <select
              id="history-year"
              value={year}
              onChange={(event) => onPeriodChange(month, Number(event.target.value))}
              className="min-h-11 w-full rounded-control border border-border-default bg-bg-canvas px-3 text-sm font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)] sm:w-28"
            >
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
