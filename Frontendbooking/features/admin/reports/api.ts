import { apiClient } from '@/lib/api/client';
import {
  monthlyReportResultSchema,
  incomeReportResultSchema,
  reportSummaryResultSchema,
  type MonthlyReportResult,
  type IncomeReportResult,
  type ReportSummaryResult,
  type ReportGranularity,
} from './schemas';

export type ReportFilterParams = {
  month?: number;
  year?: number;
};

export type ReportSummaryParams = {
  granularity: ReportGranularity;
  from: string;
  to: string;
};

export function getReportSummary(
  params: ReportSummaryParams,
  signal?: AbortSignal,
): Promise<ReportSummaryResult> {
  const query = new URLSearchParams({
    granularity: params.granularity,
    from: params.from,
    to: params.to,
  });

  return apiClient.get(
    `/api/admin/reports/summary?${query.toString()}`,
    reportSummaryResultSchema,
    { signal },
  );
}

export function getMonthlyReport(
  params: ReportFilterParams = {},
  signal?: AbortSignal,
): Promise<MonthlyReportResult> {
  const query = new URLSearchParams();
  if (params.month && params.month > 0) {
    query.set('month', params.month.toString());
  }
  if (params.year && params.year > 0) {
    query.set('year', params.year.toString());
  }

  const qs = query.toString();
  const url = qs ? `/api/admin/reports/monthly?${qs}` : '/api/admin/reports/monthly';

  return apiClient.get(url, monthlyReportResultSchema, { signal });
}

export function getIncomeReport(
  params: ReportFilterParams = {},
  signal?: AbortSignal,
): Promise<IncomeReportResult> {
  const query = new URLSearchParams();
  if (params.month && params.month > 0) {
    query.set('month', params.month.toString());
  }
  if (params.year && params.year > 0) {
    query.set('year', params.year.toString());
  }

  const qs = query.toString();
  const url = qs ? `/api/admin/reports/income?${qs}` : '/api/admin/reports/income';

  return apiClient.get(url, incomeReportResultSchema, { signal });
}
