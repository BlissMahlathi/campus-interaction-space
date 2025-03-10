
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { UserPlus, UserCheck, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export enum FriendStatus {
  NONE = 'none',
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendStatus;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  receiver: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
}

export const useFriendRequests = () => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('friend_requests')
          .select(`
            id, 
            sender_id, 
            receiver_id, 
            status, 
            created_at,
            sender:profiles!friend_requests_sender_id_fkey(id, full_name, avatar_url),
            receiver:profiles!friend_requests_receiver_id_fkey(id, full_name, avatar_url)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq('status', FriendStatus.PENDING);

        if (error) throw error;
        setRequests(data || []);
      } catch (error: any) {
        console.error('Error fetching friend requests:', error);
        toast({
          title: 'Error',
          description: 'Failed to load friend requests',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
    
    // Set up realtime subscription for friend requests
    const channel = supabase
      .channel('friend_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests',
        filter: `sender_id=eq.${user.id} OR receiver_id=eq.${user.id}`
      }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: FriendStatus.PENDING
        });

      if (error) throw error;
      
      toast({
        title: 'Friend request sent',
        description: 'Your friend request has been sent successfully'
      });
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send friend request',
        variant: 'destructive'
      });
    }
  };

  const respondToFriendRequest = async (requestId: string, status: FriendStatus) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;
      
      toast({
        title: status === FriendStatus.ACCEPTED ? 'Friend request accepted' : 'Friend request rejected',
        description: status === FriendStatus.ACCEPTED 
          ? 'You are now friends and can message each other' 
          : 'Friend request has been declined'
      });
    } catch (error: any) {
      console.error('Error responding to friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to respond to friend request',
        variant: 'destructive'
      });
    }
  };

  const checkFriendshipStatus = async (otherUserId: string) => {
    if (!user) return FriendStatus.NONE;
    
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('status')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      return data && data.length > 0 ? data[0].status : FriendStatus.NONE;
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return FriendStatus.NONE;
    }
  };

  return {
    requests,
    loading,
    sendFriendRequest,
    respondToFriendRequest,
    checkFriendshipStatus
  };
};

const FriendRequests = () => {
  const { requests, loading, respondToFriendRequest } = useFriendRequests();
  const { user } = useAuth();
  
  const pendingRequests = requests.filter(req => 
    req.status === FriendStatus.PENDING && req.receiver_id === user?.id
  );

  if (loading) {
    return <div className="p-4 text-center">Loading requests...</div>;
  }

  if (pendingRequests.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No pending friend requests</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Friend Requests</h3>
      {pendingRequests.map(request => (
        <div key={request.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{request.sender.full_name}</p>
              <p className="text-xs text-muted-foreground">Sent you a friend request</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm"
              variant="outline"
              onClick={() => respondToFriendRequest(request.id, FriendStatus.REJECTED)}
            >
              Decline
            </Button>
            <Button 
              size="sm"
              onClick={() => respondToFriendRequest(request.id, FriendStatus.ACCEPTED)}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Accept
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FriendRequests;
