import { useRouter } from 'next/router';
import '../../app/globals.css';
import UserLayout from '../../components/layouts/UserLayout';

export default function ConfirmPage() {
  const router = useRouter();

  const handleGoToDashboard = () => {
    router.push('/user'); // Change this if your dashboard is at a different path
  };

  return (
    <UserLayout>
      <div className='max-w-xl mx-auto text-center'>
        <h1 className='text-3xl font-bold mb-4'>🎉 Order Confirmed!</h1>
        <p className='text-lg mb-6'>
          Thank you for your purchase. Your order has been placed successfully.
        </p>

        <button
          onClick={handleGoToDashboard}
          className='bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700'
        >
          Go to Dashboard
        </button>
      </div>
    </UserLayout>
  );
}
