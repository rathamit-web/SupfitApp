import React from 'react';

// This component renders the Apple logo SVG as a React component

// Standard Apple logo SVG, centered and fills the viewBox
const AppleLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 48 48"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    width={props.width || 28}
    height={props.height || 28}
    {...props}
  >
    <path d="M33.6 14.1c-1.7 0-3.7-1.2-6.1-1.2-2.5 0-5 1.2-6.6 1.2-1.8 0-4.2-1.4-6.9-1.4-3.5 0-7.2 2.1-9.1 5.6-3.2 5.6-.8 13.8 2.3 18.3 1.5 2.2 3.2 4.6 5.5 4.5 2.2-.1 3-1.4 5.7-1.4 2.7 0 3.4 1.4 5.7 1.4 2.3 0 3.8-2.2 5.2-4.4 1.6-2.4 2.2-4.7 2.2-4.8-.1-.1-4.2-1.6-4.2-6.2 0-3.9 3.2-5.7 3.3-5.8-1.8-2.7-4.6-3-5.6-3.1-.2 0-.4-.1-.4-.3 0-.2.2-.3.4-.3 1.2-.1 3.8-.2 6.2 1.7 1.2-1.5 3.1-2.4 5.1-2.4.1 0 .3.1.3.3 0 .2-.2.3-.3.3zm-5.2-3.2c1.1-1.3 1.8-3.1 1.6-4.9-1.6.1-3.5 1.1-4.6 2.4-1 1.2-1.9 3-1.6 4.7 1.7.1 3.5-1 4.6-2.2z" fill="currentColor"/>
  </svg>
);

export default AppleLogo;
