'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import type { ReportSeriesItem, ReportTypeBreakdownItem, ReportGranularity } from '../schemas';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

type ReportChartsProps = {
  series: ReportSeriesItem[];
  typeBreakdown: ReportTypeBreakdownItem[];
  granularity: ReportGranularity;
};

export function ReportCharts({ series, typeBreakdown, granularity }: ReportChartsProps) {
  // 1. Time-Series Chart Setup
  const seriesLabels = series.map((s) => s.label);
  const realizedRevenueSeries = series.map((s) => s.realisasi_pendapatan_bersih);
  const estimatedRevenueSeries = series.map((s) => s.estimasi_pendapatan_kotor);

  const seriesChartData = {
    labels: seriesLabels,
    datasets: [
      {
        label: 'Realisasi Pendapatan Selesai (IDR)',
        data: realizedRevenueSeries,
        backgroundColor: '#123B3F', // Brand Teal
        borderRadius: 6,
      },
      {
        label: 'Estimasi Bruto Masuk (IDR)',
        data: estimatedRevenueSeries,
        backgroundColor: '#B89A55', // Brand Gold
        borderRadius: 6,
      },
    ],
  };

  const seriesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { font: { size: 11 }, boxWidth: 12 },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const val = typeof context.raw === 'number' ? context.raw : 0;
            return ` ${context.dataset.label}: Rp ${new Intl.NumberFormat('id-ID').format(val)}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: string | number) => {
            const num = typeof value === 'number' ? value : Number(value);
            return `Rp${new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(num)}`;
          },
          font: { size: 11 },
        },
        grid: { color: '#F0F0F0' },
      },
      x: {
        ticks: { font: { size: 10 } },
        grid: { display: false },
      },
    },
  };

  // 2. Category Distribution Setup
  const typeLabels = typeBreakdown.map((i) => i.label);
  const typeRevenue = typeBreakdown.map((i) => i.realisasi_pendapatan_bersih || i.total_pendapatan || 0);
  const typeHours = typeBreakdown.map((i) => i.total_jam);

  const colors = [
    '#123B3F', // Teal
    '#B89A55', // Gold
    '#4D7C6B', // Sage Green
  ];

  const typeBarData = {
    labels: typeLabels,
    datasets: [
      {
        label: 'Nilai Layanan Selesai (IDR)',
        data: typeRevenue,
        backgroundColor: colors,
        borderRadius: 6,
      },
    ],
  };

  const typeDoughnutData = {
    labels: typeLabels,
    datasets: [
      {
        label: 'Total Jam Terpakai',
        data: typeHours,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  };

  const typeBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const val = typeof context.raw === 'number' ? context.raw : 0;
            return ` IDR ${new Intl.NumberFormat('id-ID').format(val)}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: string | number) => {
            const num = typeof value === 'number' ? value : Number(value);
            return `Rp${new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(num)}`;
          },
          font: { size: 11 },
        },
        grid: { color: '#F0F0F0' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  const typeDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { size: 11 }, boxWidth: 12 },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) => {
            const val = context.raw ?? 0;
            return ` ${context.label}: ${val} Jam`;
          },
        },
      },
    },
  };

  const granularityLabel =
    granularity === 'day' ? 'Harian' : granularity === 'week' ? 'Mingguan' : 'Bulanan';

  return (
    <div className="space-y-6 print:break-inside-avoid">
      {/* 1. Time Series Chart */}
      <section
        aria-label={`Grafik Tren Finansial ${granularityLabel}`}
        className="rounded-card border border-border-default bg-bg-surface p-5 sm:p-6 shadow-card space-y-4"
      >
        <div>
          <h2 className="font-ui text-base font-bold text-text-primary">
            Tren Pendapatan & Nilai Layanan ({granularityLabel})
          </h2>
          <p className="text-xs text-text-muted">
            Distribusi berkala realisasi pendapatan selesai dan estimasi transaksi masuk.
          </p>
        </div>

        <div className="h-72 w-full">
          <Bar data={seriesChartData} options={seriesOptions} />
        </div>
      </section>

      {/* 2. Breakdown Charts (Bar + Doughnut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section
          aria-label="Grafik Pendapatan per Kategori Ruang"
          className="lg:col-span-7 rounded-card border border-border-default bg-bg-surface p-5 sm:p-6 shadow-card space-y-4"
        >
          <div>
            <h2 className="font-ui text-base font-bold text-text-primary">
              Nilai Realisasi per Kategori Ruang
            </h2>
            <p className="text-xs text-text-muted">
              Distribusi nilai layanan berstatus selesai berdasarkan tipe ruang kerja.
            </p>
          </div>

          <div className="h-64 w-full">
            <Bar data={typeBarData} options={typeBarOptions} />
          </div>
        </section>

        <section
          aria-label="Grafik Proporsi Durasi Penggunaan Ruangan"
          className="lg:col-span-5 rounded-card border border-border-default bg-bg-surface p-5 sm:p-6 shadow-card space-y-4"
        >
          <div>
            <h2 className="font-ui text-base font-bold text-text-primary">
              Proporsi Jam Sewa per Kategori
            </h2>
            <p className="text-xs text-text-muted">
              Perbandingan total jam pemakaian ruangan.
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <Doughnut data={typeDoughnutData} options={typeDoughnutOptions} />
          </div>
        </section>
      </div>
    </div>
  );
}
