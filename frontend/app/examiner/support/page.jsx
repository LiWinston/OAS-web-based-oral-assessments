import SupportHub from '@/components/support/SupportHub';
import { supportConfigs } from '@/components/support/supportConfigs';

export const metadata = {
  title: 'Support | Examiner',
};

export default function ExaminerSupportPage() {
  return <SupportHub config={supportConfigs.examiner} />;
}
