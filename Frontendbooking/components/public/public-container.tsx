import type { ReactNode } from 'react';

type PublicContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PublicContainer({ children, className = '' }: PublicContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
