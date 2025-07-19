export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <img
          src='/assets/loader.gif'
          alt='Loading...'
          className='h-48 w-48 mx-auto mb-4'
        />
        <p className="text-gray-600">Loading Rabbit Auto Care...</p>
      </div>
    </div>
  );
}
