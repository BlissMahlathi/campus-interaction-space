import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import MainLayout from '@/components/layout/MainLayout';
import { MessageCircle, Send, User, Menu, Image, Paperclip, UserPlus, XCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import FriendRequests, { useFriendRequests, FriendStatus } from '@/components/FriendRequests';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Import User from lucide-react (if not already imported)
import { User } from 'lucide-react';

// Fix for line 122,33: Property 'id' does not exist on type '{ id: any; name: any; }[]'
// Change from: 
// value={selectedGroup.groups.id}
// To: 
// value={selectedGroup?.id || ''}

// Fix for line 123,35: Property 'name' does not exist on type '{ id: any; name: any; }[]'
// Change from:
// {selectedGroup.groups.name}
// To:
// {selectedGroup?.name || ''}

// Fix for line 578,18: Cannot find name 'Users'. Did you mean 'User'?
// Change from:
// <Users className="h-4 w-4" />
// To:
// <User className="h-4 w-4" />
