import { CatalogPageContent } from '@/features/spaces/catalog-page';

export const metadata = {
  title: 'Katalog Space — Smart Space Booking',
  description: 'Temukan workstation, private office, dan meeting room coworking space.',
};

export default async function SpacesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipe?: string | string[] }>;
}) {
  const { tipe } = await searchParams;
  const initialTipe = typeof tipe === 'string' ? tipe : '';

  return (
    <main>
      <CatalogPageContent initialTipe={initialTipe} />
    </main>
  );
}
