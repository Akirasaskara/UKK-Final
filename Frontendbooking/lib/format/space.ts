export const spaceTypeLabels: Record<string, string> = {
  desk: 'Personal Desk',
  meeting_room: 'Meeting Room',
  private_office: 'Private Office',
};

export function formatSpaceType(tipe: string): string {
  return spaceTypeLabels[tipe] ?? tipe;
}
