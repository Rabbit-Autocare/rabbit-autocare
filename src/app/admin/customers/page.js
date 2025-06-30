import { createSupabaseServerClient } from '@/lib/supabase';
import AdminLayout from '@/components/layouts/AdminLayout';
import CustomersTable from '@/app/admin/customers/CustomersTable';

export default async function UsersPage() {
  const supabase = await createSupabaseServerClient(); // <-- await here!
  const { data: users = [], error } = await supabase.from('auth_users').select('*');
  return (
    <AdminLayout>
      <CustomersTable initialUsers={users} initialError={error?.message || null} />
    </AdminLayout>
  );
}