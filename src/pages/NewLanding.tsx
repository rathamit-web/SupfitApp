// Backup of the previous Landing.tsx (now NewLanding.tsx)



import React from 'react';

const HERO_IMAGE_URL = 'https://i.postimg.cc/J7TjDv4y/New-Landing.png';

const NewLanding = () => {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        background: '#111',
        minHeight: '100vh',
        padding: 0,
        margin: 0,
      }}
    >
      <a
        href="/auth"
        style={{
          display: 'block',
          width: '100vw',
          maxWidth: 400,
          height: '90dvh',
          maxHeight: '90dvh',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <img
          src={HERO_IMAGE_URL}
          alt="Supfit Hero"
          className="rounded-xl shadow-lg cursor-pointer"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'right center',
            background: '#111',
            display: 'block',
            borderRadius: 0,
          }}
        />
      </a>
    </div>
  );
};

export default NewLanding;
