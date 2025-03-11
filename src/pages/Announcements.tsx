
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Calendar, MapPin, User, Edit, Trash2, BellRing } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

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
  author_name?: string;
  author_avatar?: string;
  group_name?: string;
}

interface StudyGroup {
  id: string;
  name: string;
}

const Announcements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [myAnnouncements, setMyAnnouncements] = useState<Announcement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [userGroups, setUserGroups] = useState<StudyGroup[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    event_date: '',
    location: '',
    group_id: '',
    is_public: true
  });
  
  // Fetch all announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch all public announcements and user's private announcements
        const { data, error } = await supabase
          .from('announcements')
          .select(`
            *,
            profiles!announcements_created_by_fkey(full_name, avatar_url),
            study_groups!announcements_group_id_fkey(name)
          `)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Process announcements
        const processedAnnouncements = data?.map(item => ({
          ...item,
          created_at: new Date(item.created_at).toLocaleDateString(),
          author_name: item.profiles?.full_name || 'Anonymous',
          author_avatar: item.profiles?.avatar_url || null,
          group_name: item.study_groups?.name || null,
          event_date: item.event_date ? new Date(item.event_date).toLocaleDateString() : null
        })) || [];
        
        setAnnouncements(processedAnnouncements);
        
        // Filter for my announcements
        const userAnnouncements = processedAnnouncements.filter(
          announcement => announcement.created_by === user.id
        );
        setMyAnnouncements(userAnnouncements);
        
        // Fetch user's study groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('study_group_members')
          .select(`
            study_groups!inner(id, name)
          `)
          .eq('user_id', user.id);
          
        if (groupsError) throw groupsError;
        
        const groups = groupsData?.map(item => ({
          id: item.study_groups.id,
          name: item.study_groups.name
        })) || [];
        
        setUserGroups(groups);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        toast({
          title: 'Error',
          description: 'Failed to load announcements',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnnouncements();
    
    // Set up realtime subscription for announcements
    const announcementsChannel = supabase
      .channel('public:announcements')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'announcements' }, 
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(announcementsChannel);
    };
  }, [user, toast]);
  
  // Handle form submission for creating/editing announcement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in the required fields',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const announcementData = {
        title: formData.title,
        content: formData.content,
        event_date: formData.event_date || null,
        location: formData.location || null,
        group_id: formData.group_id || null,
        is_public: formData.is_public,
        created_by: user.id
      };
      
      if (editingAnnouncement) {
        // Update existing announcement
        const { error } = await supabase
          .from('announcements')
          .update(announcementData)
          .eq('id', editingAnnouncement.id);
          
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Announcement updated successfully'
        });
      } else {
        // Create new announcement
        const { error } = await supabase
          .from('announcements')
          .insert(announcementData);
          
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Announcement created successfully'
        });
      }
      
      // Reset form and close dialog
      setFormData({
        title: '',
        content: '',
        event_date: '',
        location: '',
        group_id: '',
        is_public: true
      });
      setEditingAnnouncement(null);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to save announcement',
        variant: 'destructive'
      });
    }
  };
  
  // Handle editing an announcement
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      event_date: announcement.event_date ? new Date(announcement.event_date).toISOString().split('T')[0] : '',
      location: announcement.location || '',
      group_id: announcement.group_id || '',
      is_public: announcement.is_public
    });
    setShowCreateDialog(true);
  };
  
  // Handle deleting an announcement
  const handleDelete = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Announcement deleted successfully'
      });
      
      // Update local state
      setAnnouncements(announcements.filter(a => a.id !== id));
      setMyAnnouncements(myAnnouncements.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive'
      });
    }
  };
  
  // Filter announcements based on search term
  const filteredAnnouncements = announcements.filter(announcement => 
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (announcement.location && announcement.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (announcement.group_name && announcement.group_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 px-4">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Campus Announcements</h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input 
                placeholder="Search announcements..." 
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {user && (
              <Button className="w-full sm:w-auto" onClick={() => {
                setEditingAnnouncement(null);
                setFormData({
                  title: '',
                  content: '',
                  event_date: '',
                  location: '',
                  group_id: '',
                  is_public: true
                });
                setShowCreateDialog(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                New Announcement
              </Button>
            )}
          </div>
          
          {/* My Announcements Section */}
          {user && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold mb-4">My Announcements</h2>
              {loading ? (
                <Card className="bg-card p-6 text-center">
                  <p className="text-muted-foreground">Loading your announcements...</p>
                </Card>
              ) : myAnnouncements.length === 0 ? (
                <Card className="bg-card p-6 text-center">
                  <p className="text-muted-foreground">You haven't created any announcements yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setEditingAnnouncement(null);
                      setFormData({
                        title: '',
                        content: '',
                        event_date: '',
                        location: '',
                        group_id: '',
                        is_public: true
                      });
                      setShowCreateDialog(true);
                    }}
                  >
                    Create Your First Announcement
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myAnnouncements.map((announcement) => (
                    <AnnouncementCard 
                      key={announcement.id}
                      announcement={announcement}
                      currentUser={user}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
          
          {/* All Announcements Section */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Campus Announcements</h2>
            {loading ? (
              <Card className="bg-card p-6 text-center">
                <p className="text-muted-foreground">Loading announcements...</p>
              </Card>
            ) : filteredAnnouncements.length === 0 ? (
              <Card className="bg-card p-6 text-center">
                <p className="text-muted-foreground">No announcements found</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAnnouncements.map((announcement) => (
                  <AnnouncementCard 
                    key={announcement.id}
                    announcement={announcement}
                    currentUser={user}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      
      {/* Create/Edit Announcement Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
            <DialogDescription>
              {editingAnnouncement 
                ? 'Update your announcement details'
                : 'Share important information or events with the campus'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Title *</label>
                <Input
                  id="title"
                  placeholder="e.g., Guest Lecture on Climate Change"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium">Content *</label>
                <Textarea
                  id="content"
                  placeholder="Provide details about your announcement"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="event_date" className="text-sm font-medium">Event Date (optional)</label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">Location (optional)</label>
                  <Input
                    id="location"
                    placeholder="e.g., Main Auditorium"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
              {userGroups.length > 0 && (
                <div className="space-y-2">
                  <label htmlFor="group_id" className="text-sm font-medium">Post to Study Group (optional)</label>
                  <select
                    id="group_id"
                    className="w-full p-2 border rounded-md"
                    value={formData.group_id}
                    onChange={(e) => setFormData({...formData, group_id: e.target.value})}
                  >
                    <option value="">None (Post to everyone)</option>
                    {userGroups.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input
                  id="is_public"
                  type="checkbox"
                  className="form-checkbox h-4 w-4"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                />
                <label htmlFor="is_public" className="text-sm font-medium">
                  Make announcement public
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowCreateDialog(false);
                setEditingAnnouncement(null);
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingAnnouncement ? 'Update' : 'Post'} Announcement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

// Announcement Card Component
const AnnouncementCard = ({ 
  announcement, 
  currentUser, 
  onEdit, 
  onDelete 
}: { 
  announcement: Announcement, 
  currentUser: any, 
  onEdit: (announcement: Announcement) => void, 
  onDelete: (id: string) => void 
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-secondary/50 pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg truncate">{announcement.title}</CardTitle>
          {currentUser && announcement.created_by === currentUser.id && (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <span className="sr-only">Open menu</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                  >
                    <path
                      d="M3.625 7.5C3.625 8.12 3.12 8.625 2.5 8.625C1.88 8.625 1.375 8.12 1.375 7.5C1.375 6.88 1.88 6.375 2.5 6.375C3.12 6.375 3.625 6.88 3.625 7.5ZM8.625 7.5C8.625 8.12 8.12 8.625 7.5 8.625C6.88 8.625 6.375 8.12 6.375 7.5C6.375 6.88 6.88 6.375 7.5 6.375C8.12 6.375 8.625 6.88 8.625 7.5ZM13.625 7.5C13.625 8.12 13.12 8.625 12.5 8.625C11.88 8.625 11.375 8.12 11.375 7.5C11.375 6.88 11.88 6.375 12.5 6.375C13.12 6.375 13.625 6.88 13.625 7.5Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(announcement)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(announcement.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center mt-1">
          <Avatar className="h-5 w-5 mr-2">
            {announcement.author_avatar ? (
              <AvatarImage src={announcement.author_avatar} />
            ) : (
              <AvatarFallback>
                <User className="h-3 w-3" />
              </AvatarFallback>
            )}
          </Avatar>
          <span className="text-xs text-muted-foreground">{announcement.author_name}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-sm line-clamp-3">{announcement.content}</p>
        
        <div className="mt-4 space-y-2">
          {announcement.event_date && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="mr-2 h-3 w-3" />
              <span>{announcement.event_date}</span>
            </div>
          )}
          
          {announcement.location && (
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="mr-2 h-3 w-3" />
              <span>{announcement.location}</span>
            </div>
          )}
          
          {announcement.group_name && (
            <div className="flex items-center text-xs">
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Users className="h-3 w-3" />
                {announcement.group_name}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Posted: {announcement.created_at}</span>
        {announcement.is_public ? (
          <Badge variant="secondary" className="text-xs">Public</Badge>
        ) : (
          <Badge variant="outline" className="text-xs">Private</Badge>
        )}
      </CardFooter>
    </Card>
  );
};

export default Announcements;
