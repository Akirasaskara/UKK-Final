export function formatDateIndonesia(isoOrDateString: string): string {
  const parsed = new Date(isoOrDateString);
  if (Number.isNaN(parsed.getTime())) return isoOrDateString;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

export function formatDateRangeIndonesia(
  startDateIso: string,
  endDateIso: string,
): string {
  const start = new Date(startDateIso);
  const end = new Date(endDateIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDateIso} s.d. ${endDateIso}`;
  }

  const formatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `${formatter.format(start)} s.d. ${formatter.format(end)}`;
}
