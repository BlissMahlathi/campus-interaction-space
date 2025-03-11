
import React from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-accent">
      <Sidebar />
      <main className="pl-16 md:pl-64 min-h-screen">
        <div className="container py-6 px-4 md:px-6 max-w-full md:max-w-5xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
