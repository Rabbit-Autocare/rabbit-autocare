import React from 'react';

/**
 * VideoHeroSection
 * Props:
 *   videoUrl: string (Supabase public video URL)
 *   posterUrl?: string (optional fallback image)
 *   overlayContent?: ReactNode (optional overlay for text/buttons)
 *
 * This component is designed to flow behind a transparent navbar
 * Make sure your navbar has: position: fixed, top-0, left-0, w-full, z-50, bg-transparent
 */
const VideoHeroSection = ({
  videoUrl = 'https://ubnifppknfszvqkxqbfp.supabase.co/storage/v1/object/public/staticimages//rent-a-car-sign-and-luxury-suv-2023-11-27-04-57-30-utc.mp4',
  posterUrl = '/assets/banner.png', // fallback image
  overlayContent = null,
}) => {
  return (
    <section className="relative -top-30 w-full h-screen overflow-visible flex items-center justify-center bg-black">
      {/* Video background that flows behind navbar */}
      <video
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={posterUrl}
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />


    </section>
  );
};

export default VideoHeroSection;
