
import React from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-accent">
      <Sidebar />
      <main className="pl-0 pt-16 md:pl-64 md:pt-0 min-h-screen">
        <div className="py-6 px-4 md:px-6 max-w-full mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
