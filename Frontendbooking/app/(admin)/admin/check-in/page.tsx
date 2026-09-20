import { CheckInPageContent } from '@/features/admin/check-in/components/check-in-page-content';

export const metadata = {
  title: 'Verifikasi dan Check-In | Smart Space Booking Admin',
  description: 'Verifikasi token e-ticket dan proses check-in kedatangan member.',
};

export default function CheckInPage() {
  return (
    <div>
      <CheckInPageContent />
    </div>
  );
}
