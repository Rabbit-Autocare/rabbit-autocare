import { UserService } from '@/lib/service/userService';
import UserProfileClient from '@/components/user/UserProfileClient';
import { redirect } from 'next/navigation';

export default async function UserProfilePage() {
  // Get user session on server side
  const { success: sessionSuccess, user } = await UserService.getUserSession();

  if (!sessionSuccess || !user) {
    redirect('/login');
  }

  // Fetch user profile data on server side
  const { success: profileSuccess, data: profileData } = await UserService.getUserProfile(user.id);

  if (!profileSuccess) {
    // Handle error - could redirect to error page or show fallback
    console.error('Failed to fetch user profile');
  }

  const userData = {
    id: user.id,
    name: profileData?.name || user.user_metadata?.name || '',
    phone_number: profileData?.phone_number || user.user_metadata?.phone_number || '',
    email: user.email || '',
  };

  return <UserProfileClient initialData={userData} />;
}
