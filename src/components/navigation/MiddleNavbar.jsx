<<<<<<< HEAD
'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function MiddleNavbar() {
  return (
    <div className='border-b py-4'>
      <div className='container mx-auto flex justify-center'>
        <Link href='/' className='text-4xl font-bold'>
          <Image
            src='/assets/RabbitLogo.png'
            alt='logo'
            width={200}
            height={200}
          />
        </Link>
      </div>
    </div>
  );
=======
"use client";

import Link from "next/link";
import Image from "next/image";

export default function MiddleNavbar() {
	return (
		<div className="border-b py-4">
			<div className="container mx-auto flex justify-center">
				<Link href="/" className="text-4xl font-bold">
					<Image
						src="/assets/RabbitLogo.png"
						alt="logo"
						width={200}
						height={200}
					/>
				</Link>
			</div>
		</div>
	);
>>>>>>> 40c4643f54a9163bf182ae9d04607553a7807feb
}
