import SupportHub from '@/components/support/SupportHub';
import { supportConfigs } from '@/components/support/supportConfigs';

export const metadata = {
  title: 'Support | Student',
};

export default function StudentSupportPage() {
  return <SupportHub config={supportConfigs.student} />;
}
