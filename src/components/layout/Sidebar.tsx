
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  BookOpen, 
  MessageCircle, 
  Settings, 
  User, 
  LogOut, 
  Store, 
  Bell,
  Shield
} from 'lucide-react'; 
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const Sidebar = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  const closeSidebar = () => {
    if (isMobile) setOpen(false);
  };

  const navigation = [
    { name: 'Hub', href: '/hub', icon: Home },
    { name: 'Study Groups', href: '/study-groups', icon: Users },
    { name: 'Resources', href: '/announcements', icon: BookOpen },
    { name: 'Messages', href: '/messages', icon: MessageCircle },
    { name: 'Marketplace', href: '/marketplace', icon: Store },
    { name: 'Announcements', href: '/announcements', icon: Bell },
  ];

  if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield });
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <Link to="/hub" className="flex items-center gap-2" onClick={closeSidebar}>
          <div className="bg-primary text-primary-foreground p-1 rounded">
            <BookOpen className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl">CampusSpace</span>
        </Link>
      </div>
      
      <Separator />
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map(item => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center justify-start gap-2 px-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[150px]">{user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { navigate('/profile'); closeSidebar(); }}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { navigate('/settings'); closeSidebar(); }}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="space-y-2">
            <Button variant="default" className="w-full" onClick={() => navigate('/signin')}>
              Sign In
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </div>
  );
  
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-40 h-16 bg-background border-b flex items-center px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <span className="sr-only">Toggle menu</span>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 max-w-[300px]">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <Link to="/hub" className="ml-4 flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1 rounded">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">CampusSpace</span>
          </Link>
        </div>
        <div className="h-16" /> {/* Spacer for fixed header */}
      </>
    );
  }

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-64 border-r bg-background h-full hidden md:block">
      <SidebarContent />
    </div>
  );
};

export default Sidebar;
