
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon, MoreVertical, MapPin, Calendar as CalendarIcon2, Users, Megaphone, Plus, User, School
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  event_date: string | null;
  location: string | null;
  created_by: string;
  group_id: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profiles: Profile;
  study_groups?: StudyGroup | null;
}

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(undefined);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'public' | 'groups'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        // Fetch announcements
        const { data: announcementsData, error: announcementsError } = await supabase
          .from('announcements')
          .select(`
            *,
            profiles(id, full_name, avatar_url),
            study_groups(id, name, description, created_by)
          `)
          .order('created_at', { ascending: false });
          
        if (announcementsError) throw announcementsError;
        
        // Fetch study groups user is part of
        const { data: groupsData, error: groupsError } = await supabase
          .from('study_group_members')
          .select(`
            study_groups(id, name, description, created_by, created_at)
          `)
          .eq('user_id', user.id);
          
        if (groupsError) throw groupsError;
        
        // Also fetch groups created by the user
        const { data: createdGroupsData, error: createdGroupsError } = await supabase
          .from('study_groups')
          .select('*')
          .eq('created_by', user.id);
          
        if (createdGroupsError) throw createdGroupsError;
        
        // Combine and deduplicate groups
        const memberGroups = (groupsData || []).map(item => item.study_groups);
        const allGroups = [...memberGroups, ...(createdGroupsData || [])];
        const uniqueGroups = Array.from(new Map(allGroups.map(group => [group.id, group])).values());
        
        setStudyGroups(uniqueGroups);
        setAnnouncements(announcementsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load announcements',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Subscribe to changes
    const announcementsChannel = supabase
      .channel('announcements-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'announcements'
      }, () => {
        fetchData();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(announcementsChannel);
    };
  }, [user, toast]);
  
  const handleSubmit = async () => {
    if (!user) return;
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please fill in the required fields',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newAnnouncement = {
        title,
        content,
        event_date: eventDate ? eventDate.toISOString() : null,
        location: location || null,
        created_by: user.id,
        group_id: selectedGroup || null,
        is_public: selectedGroup ? false : isPublic
      };
      
      const { data, error } = await supabase
        .from('announcements')
        .insert(newAnnouncement)
        .select(`
          *,
          profiles(id, full_name, avatar_url),
          study_groups(id, name, description, created_by)
        `)
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Announcement created',
        description: 'Your announcement has been published'
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setLocation('');
      setEventDate(undefined);
      setIsPublic(true);
      setSelectedGroup(undefined);
      
      // Add to local state
      if (data) {
        setAnnouncements(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to create announcement',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const deleteAnnouncement = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Announcement deleted',
        description: 'Your announcement has been removed'
      });
      
      // Update local state
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive'
      });
    }
  };
  
  const filteredAnnouncements = announcements.filter(announcement => {
    if (filter === 'all') return true;
    if (filter === 'public') return announcement.is_public;
    if (filter === 'groups') return announcement.group_id !== null;
    return true;
  });
  
  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <Select value={filter} onValueChange={(value: 'all' | 'public' | 'groups') => setFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Announcements</SelectItem>
            <SelectItem value="public">Public Only</SelectItem>
            <SelectItem value="groups">Study Groups</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mb-6">
            <Plus className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
        </DialogTrigger>
        <DialogContent className={cn("sm:max-w-[525px]", isMobile ? "w-[90vw]" : "")}>
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>
              Share important information with the community or your study groups
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="content" className="text-sm font-medium">Content</label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your announcement here"
                rows={5}
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="date" className="text-sm font-medium">Event Date (Optional)</label>
              <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={(date) => {
                      setEventDate(date);
                      setIsDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="location" className="text-sm font-medium">Location (Optional)</label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter event location"
              />
            </div>
            
            {studyGroups.length > 0 && (
              <div className="grid gap-2">
                <label htmlFor="group" className="text-sm font-medium">Post to Study Group (Optional)</label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group or leave empty for public" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Post Publicly</SelectItem>
                    {studyGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {!selectedGroup && (
              <div className="flex items-center space-x-2">
                <label htmlFor="public" className="text-sm font-medium">
                  Make announcement public
                </label>
                <input
                  id="public"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {loading ? (
        <div className="text-center py-8">Loading announcements...</div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Megaphone className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No announcements found.</p>
          <p className="text-sm">Be the first to create an announcement!</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-4 pr-4">
            {filteredAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {announcement.profiles.avatar_url ? (
                          <AvatarImage src={announcement.profiles.avatar_url} alt={announcement.profiles.full_name} />
                        ) : (
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{announcement.title}</CardTitle>
                        <CardDescription>
                          By {announcement.profiles.full_name} • {new Date(announcement.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    
                    {user && announcement.created_by === user.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => deleteAnnouncement(announcement.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="whitespace-pre-line">{announcement.content}</p>
                </CardContent>
                
                {(announcement.event_date || announcement.location || announcement.group_id) && (
                  <CardFooter className="flex flex-wrap gap-3 pt-0 border-t px-6 py-3 bg-muted/50">
                    {announcement.event_date && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarIcon2 className="h-3 w-3 mr-1" />
                        <span>{new Date(announcement.event_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    
                    {announcement.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{announcement.location}</span>
                      </div>
                    )}
                    
                    {announcement.group_id && announcement.study_groups && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <School className="h-3 w-3 mr-1" />
                        <span>{announcement.study_groups.name}</span>
                      </div>
                    )}
                    
                    {announcement.is_public && !announcement.group_id && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="h-3 w-3 mr-1" />
                        <span>Public</span>
                      </div>
                    )}
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </MainLayout>
  );
};

export default Announcements;
