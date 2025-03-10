
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, ShoppingBag, MessageCircle, User, Settings, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Sidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/hub', icon: BookOpen, label: 'Info Hub' },
    { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { to: '/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/admin', icon: Settings, label: 'Admin' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold hidden md:block">CampusSpace</span>
        </Link>
      </div>
      
      <nav className="flex-1 p-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center space-x-2 p-3 rounded-lg transition-colors
              ${location.pathname === link.to 
                ? 'bg-primary text-white' 
                : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <link.icon className="h-5 w-5" />
            <span className="hidden md:block">{link.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );

  // For mobile, use a sheet component
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 px-4 flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 max-w-[250px]">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          
          <span className="text-xl font-bold">CampusSpace</span>
        </div>
        <div className="h-16" /> {/* Spacer for fixed header */}
      </>
    );
  }

  // For desktop, use the regular sidebar
  return (
    <aside className="fixed left-0 top-0 h-screen w-16 md:w-64 bg-white border-r border-gray-200 z-50">
      <SidebarContent />
    </aside>
  );
};

export default Sidebar;
