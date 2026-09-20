import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReportPeriodFilter } from '@/features/admin/reports/components/report-period-filter';

describe('ReportPeriodFilter', () => {
  it('switches to daily mode and emits a bounded date range', async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();

    render(
      <ReportPeriodFilter
        granularity="month"
        from="2026-09-01"
        to="2026-09-30"
        onApply={onApply}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Harian' }));

    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ granularity: 'day' }));
    const emitted = onApply.mock.calls.at(-1)?.[0] as { from: string; to: string };
    const days = Math.floor(
      (Date.parse(`${emitted.to}T00:00:00Z`) - Date.parse(`${emitted.from}T00:00:00Z`)) /
        86_400_000,
    ) + 1;
    expect(days).toBe(14);
  });

  it('submits custom weekly dates only after apply', async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();

    render(
      <ReportPeriodFilter
        granularity="week"
        from="2026-09-01"
        to="2026-09-30"
        onApply={onApply}
      />,
    );

    const from = screen.getByLabelText('Dari:');
    const to = screen.getByLabelText('Sampai:');
    await user.clear(from);
    await user.type(from, '2026-08-01');
    await user.clear(to);
    await user.type(to, '2026-08-31');
    await user.click(screen.getByRole('button', { name: 'Terapkan' }));

    expect(onApply).toHaveBeenCalledWith({
      granularity: 'week',
      from: '2026-08-01',
      to: '2026-08-31',
    });
  });
});
