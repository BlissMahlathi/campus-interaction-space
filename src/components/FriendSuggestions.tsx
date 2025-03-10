
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, User } from 'lucide-react';
import { FriendStatus, useFriendRequests } from './FriendRequests';

interface ProfileWithInterests {
  id: string;
  full_name: string;
  avatar_url: string;
  field_of_study: string;
  study_year: number;
  interests: string[];
  common_interests: number;
}

const FriendSuggestions = () => {
  const [suggestions, setSuggestions] = useState<ProfileWithInterests[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendFriendRequest, checkFriendshipStatus } = useFriendRequests();
  const [friendStatuses, setFriendStatuses] = useState<{[key: string]: FriendStatus}>({});

  useEffect(() => {
    if (!user) return;

    const fetchSuggestions = async () => {
      try {
        // First get current user's interests
        const { data: userInterests, error: interestsError } = await supabase
          .from('user_interests')
          .select('category')
          .eq('user_id', user.id);

        if (interestsError) throw interestsError;
        
        const userInterestCategories = userInterests?.map(i => i.category) || [];
        
        // Get all users with their interests
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, field_of_study, study_year')
          .neq('id', user.id);
          
        if (profilesError) throw profilesError;
        
        if (!profiles) {
          setSuggestions([]);
          setLoading(false);
          return;
        }
        
        // Get all interests for all users
        const { data: allInterests, error: allInterestsError } = await supabase
          .from('user_interests')
          .select('user_id, category')
          .in('user_id', profiles.map(p => p.id));
          
        if (allInterestsError) throw allInterestsError;
        
        // Organize interests by user
        const interestsByUser: {[key: string]: string[]} = {};
        allInterests?.forEach(interest => {
          if (!interestsByUser[interest.user_id]) {
            interestsByUser[interest.user_id] = [];
          }
          interestsByUser[interest.user_id].push(interest.category);
        });
        
        // Calculate common interests and create suggestions
        const profilesWithInterests: ProfileWithInterests[] = profiles.map(profile => {
          const interests = interestsByUser[profile.id] || [];
          const common = interests.filter(i => userInterestCategories.includes(i)).length;
          
          return {
            ...profile,
            interests,
            common_interests: common
          };
        });
        
        // Sort by common interests (most matches first)
        profilesWithInterests.sort((a, b) => b.common_interests - a.common_interests);
        
        // Check friendship status for each suggestion
        for (const profile of profilesWithInterests) {
          const status = await checkFriendshipStatus(profile.id);
          setFriendStatuses(prev => ({...prev, [profile.id]: status}));
        }
        
        setSuggestions(profilesWithInterests);
      } catch (error) {
        console.error('Error fetching friend suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [user, checkFriendshipStatus]);

  const handleSendRequest = async (profileId: string) => {
    await sendFriendRequest(profileId);
    setFriendStatuses(prev => ({...prev, [profileId]: FriendStatus.PENDING}));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-center py-4 text-muted-foreground">Loading suggestions...</p>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">Friend Suggestions</h3>
          <p className="text-center py-4 text-muted-foreground">No suggestions available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-medium mb-4">Friend Suggestions</h3>
        <div className="space-y-3">
          {suggestions.slice(0, 3).map((profile) => (
            <div key={profile.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.common_interests > 0 
                      ? `${profile.common_interests} common interest${profile.common_interests > 1 ? 's' : ''}`
                      : profile.field_of_study || 'Suggested for you'}
                  </p>
                </div>
              </div>
              
              {friendStatuses[profile.id] === FriendStatus.NONE && (
                <Button 
                  size="sm"
                  onClick={() => handleSendRequest(profile.id)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
              
              {friendStatuses[profile.id] === FriendStatus.PENDING && (
                <Button 
                  size="sm"
                  variant="outline"
                  disabled
                >
                  Pending
                </Button>
              )}
              
              {friendStatuses[profile.id] === FriendStatus.ACCEPTED && (
                <Button 
                  size="sm"
                  variant="outline"
                  disabled
                >
                  Friends
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendSuggestions;
