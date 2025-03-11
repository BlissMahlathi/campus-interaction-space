
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import MainLayout from '@/components/layout/MainLayout';
import { MessageCircle, Send, XCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name?: string;
}

const Announcements = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          created_at,
          user_id,
          profiles(full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedData = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        created_at: item.created_at,
        user_id: item.user_id,
        user_name: item.profiles?.full_name || 'Unknown User'
      }));
      
      setAnnouncements(formattedData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load announcements',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide both title and content',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('announcements')
        .insert([
          {
            title,
            content,
            user_id: user?.id,
          },
        ]);

      if (error) throw error;

      setTitle('');
      setContent('');
      toast({
        title: 'Success',
        description: 'Announcement posted successfully',
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error posting announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to post announcement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAnnouncements(announcements.filter(announcement => announcement.id !== id));
      toast({
        title: 'Success',
        description: 'Announcement deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <MainLayout>
      <div className="w-full px-4 sm:px-6 md:max-w-4xl md:mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center md:text-left">Announcements</h1>
        
        {isAdmin && (
          <Card className="p-4 mb-8 overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Title
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Announcement Title"
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="content" className="block text-sm font-medium mb-1">
                    Content
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Announcement content..."
                    className="w-full h-24 p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  {loading ? "Posting..." : "Post Announcement"}
                </Button>
              </div>
            </form>
          </Card>
        )}
        
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No announcements available.
            </div>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="p-4 overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <div className="break-words max-w-[85%]">
                    <h3 className="font-bold text-lg">{announcement.title}</h3>
                    <div className="text-sm text-muted-foreground">
                      By {announcement.user_name} • {formatDate(announcement.created_at)}
                    </div>
                  </div>
                  {(isAdmin || user?.id === announcement.user_id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAnnouncement(announcement.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words">{announcement.content}</p>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Announcements;
