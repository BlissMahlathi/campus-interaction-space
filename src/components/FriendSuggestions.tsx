
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { UserPlus, UserCheck, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendRequests, FriendStatus } from '@/components/FriendRequests';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserSuggestion {
  id: string;
  full_name: string;
  avatar_url: string;
  field_of_study: string;
  common_interests: number;
  interests: string[];
}

const FriendSuggestions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendFriendRequest, checkFriendshipStatus } = useFriendRequests();
  
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [filterBy, setFilterBy] = useState<string>('common_interests');

  useEffect(() => {
    if (!user) return;

    const fetchUserInterests = async () => {
      try {
        const { data, error } = await supabase
          .from('user_interests')
          .select('category')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        setUserInterests(data.map(item => item.category));
      } catch (error) {
        console.error('Error fetching user interests:', error);
      }
    };
    
    const fetchSuggestions = async () => {
      try {
        // Get all users except current user
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id);
        
        if (profilesError) throw profilesError;
        
        // Get all interests
        const { data: allInterests, error: interestsError } = await supabase
          .from('user_interests')
          .select('*');
        
        if (interestsError) throw interestsError;
        
        // Process the results
        const userSuggestions: UserSuggestion[] = [];
        
        for (const profile of profiles || []) {
          // Get friendship status
          const status = await checkFriendshipStatus(profile.id);
          
          // Skip if already friends or friend request pending
          if (status === FriendStatus.ACCEPTED || status === FriendStatus.PENDING) {
            continue;
          }
          
          // Get user's interests
          const interests = allInterests
            .filter(interest => interest.user_id === profile.id)
            .map(interest => interest.category);
          
          // Calculate common interests
          const common = interests.filter(interest => 
            userInterests.includes(interest)
          );
          
          userSuggestions.push({
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            field_of_study: profile.field_of_study || '',
            common_interests: common.length,
            interests: interests
          });
        }
        
        setSuggestions(userSuggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load friend suggestions',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserInterests().then(() => fetchSuggestions());
  }, [user, toast, checkFriendshipStatus]);

  const handleSendRequest = async (userId: string) => {
    await sendFriendRequest(userId);
    // Remove from suggestions
    setSuggestions(prev => prev.filter(s => s.id !== userId));
  };

  const sortSuggestions = () => {
    switch (filterBy) {
      case 'common_interests':
        return [...suggestions].sort((a, b) => b.common_interests - a.common_interests);
      case 'alphabetical':
        return [...suggestions].sort((a, b) => a.full_name.localeCompare(b.full_name));
      case 'field_of_study':
        return [...suggestions].sort((a, b) => a.field_of_study.localeCompare(b.field_of_study));
      default:
        return suggestions;
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading suggestions...</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No friend suggestions available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">People You May Know</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilterBy('common_interests')}>
              Common Interests
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterBy('alphabetical')}>
              Name (A-Z)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterBy('field_of_study')}>
              Field of Study
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {sortSuggestions().slice(0, 3).map(suggestion => (
        <div key={suggestion.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={suggestion.avatar_url} alt={suggestion.full_name} />
              <AvatarFallback>{suggestion.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{suggestion.full_name}</p>
              <p className="text-xs text-muted-foreground">{suggestion.field_of_study}</p>
              {suggestion.common_interests > 0 && (
                <p className="text-xs text-primary">{suggestion.common_interests} common interests</p>
              )}
            </div>
          </div>
          <Button 
            size="sm"
            onClick={() => handleSendRequest(suggestion.id)}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Connect
          </Button>
        </div>
      ))}
      
      {suggestions.length > 3 && (
        <div className="text-center mt-2">
          <Button variant="link" size="sm">
            See More
          </Button>
        </div>
      )}
    </div>
  );
};

export default FriendSuggestions;
