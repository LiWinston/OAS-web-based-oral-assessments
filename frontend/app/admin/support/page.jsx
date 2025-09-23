import SupportHub from '@/components/support/SupportHub';
import { supportConfigs } from '@/components/support/supportConfigs';

export const metadata = {
  title: 'Support | Course Admin',
};

export default function AdminSupportPage() {
  return <SupportHub config={supportConfigs.admin} />;
}
