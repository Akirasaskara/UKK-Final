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
import type { ReportTypeBreakdownItem } from '../schemas';

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
  items: ReportTypeBreakdownItem[];
};

export function ReportCharts({ items }: ReportChartsProps) {
  const labels = items.map((i) => i.label);
  const revenueData = items.map((i) => i.total_pendapatan);
  const hoursData = items.map((i) => i.total_jam);

  const colors = [
    '#246168', // Teal Dark
    '#80662E', // Gold Muted
    '#4D7C6B', // Sage Green
  ];

  const barChartData = {
    labels,
    datasets: [
      {
        label: 'Nilai Layanan (IDR)',
        data: revenueData,
        backgroundColor: colors,
        borderRadius: 8,
      },
    ],
  };

  const doughnutChartData = {
    labels,
    datasets: [
      {
        label: 'Total Jam',
        data: hoursData,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { size: 11 }, boxWidth: 14 },
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:break-inside-avoid">
      {/* 1. Bar Chart: Pendapatan per Kategori */}
      <section
        aria-label="Grafik Pendapatan per Kategori Ruang"
        className="lg:col-span-7 rounded-card border border-border-default bg-bg-surface p-5 sm:p-6 shadow-card space-y-4"
      >
        <div>
          <h2 className="font-ui text-base font-bold text-text-primary">
            Nilai Layanan per Kategori Ruang
          </h2>
          <p className="text-xs text-text-muted">
            Grafik distribusi nilai bruto pemesanan berdasarkan tipe ruang kerja.
          </p>
        </div>

        <div className="h-64 w-full">
          <Bar data={barChartData} options={barOptions} />
        </div>
      </section>

      {/* 2. Doughnut Chart: Proporsi Jam */}
      <section
        aria-label="Grafik Proporsi Durasi Penggunaan Ruangan"
        className="lg:col-span-5 rounded-card border border-border-default bg-bg-surface p-5 sm:p-6 shadow-card space-y-4"
      >
        <div>
          <h2 className="font-ui text-base font-bold text-text-primary">
            Proporsi Durasi Jam Sewa
          </h2>
          <p className="text-xs text-text-muted">
            Perbandingan total jam pemakaian ruangan.
          </p>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          <Doughnut data={doughnutChartData} options={doughnutOptions} />
        </div>
      </section>
    </div>
  );
}
