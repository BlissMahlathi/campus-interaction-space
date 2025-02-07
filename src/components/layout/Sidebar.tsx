
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, ShoppingBag, MessageCircle, User, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/hub', icon: BookOpen, label: 'Info Hub' },
    { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { to: '/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/admin', icon: Settings, label: 'Admin' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 md:w-64 bg-white border-r border-gray-200 z-50">
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
    </aside>
  );
};

export default Sidebar;
