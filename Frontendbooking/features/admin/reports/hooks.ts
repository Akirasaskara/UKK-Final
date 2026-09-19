'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import {
  getMonthlyReport,
  getIncomeReport,
  type ReportFilterParams,
} from './api';

export function useMonthlyReport(params: ReportFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.reports.monthly(params),
    queryFn: ({ signal }) => getMonthlyReport(params, signal),
  });
}

export function useIncomeReport(params: ReportFilterParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.reports.income(params),
    queryFn: ({ signal }) => getIncomeReport(params, signal),
  });
}
