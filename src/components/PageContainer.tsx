import React from 'react';

type PageContainerProps = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

// Standardized compact page container to reduce whitespace and align typography
export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`w-full flex justify-center px-4 py-6 sm:py-8 ${className}`}>
      <div className="page-container">{children}</div>
    </div>
  );
}

export default PageContainer;
