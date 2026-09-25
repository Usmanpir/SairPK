import { requireManagementPage } from '@/lib/admin/guard';
import { assignableRoles } from '@/lib/roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/admin/PageHeader';
import { CreateUserForm } from '@/components/admin/UserForms';

export const metadata = { title: 'New account' };

export default async function NewUserPage() {
  const user = await requireManagementPage();

  return (
    <>
      <PageHeader
        back={{ href: '/admin/users', label: 'All accounts' }}
        title="New account"
        description={
          user.role === 'SUPER_ADMIN'
            ? 'Create an account with any role.'
            : 'Admins can create customer, hotel manager, tour operator and guide accounts.'
        }
      />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm roles={assignableRoles(user.role)} />
        </CardContent>
      </Card>
    </>
  );
}
