
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Edit2, Plus, X } from "lucide-react";
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

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  field_of_study: string;
  study_year: number | null;
}

interface UserInterest {
  id: string;
  category: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [interests, setInterests] = useState<UserInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [newInterest, setNewInterest] = useState('');
  
  const allInterests = [
    { value: 'hydrology', label: 'Hydrology' },
    { value: 'earth_science', label: 'Earth Science' },
    { value: 'environmental_science', label: 'Environmental Science' },
    { value: 'geology', label: 'Geology' },
    { value: 'water_resources', label: 'Water Resources' },
    { value: 'climate_science', label: 'Climate Science' },
    { value: 'biology', label: 'Biology' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'physics', label: 'Physics' },
  ];
  
  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        setProfile(data);
        setEditedProfile(data);
        
        // Fetch user interests
        const { data: interestsData, error: interestsError } = await supabase
          .from('user_interests')
          .select('*')
          .eq('user_id', user.id);
          
        if (interestsError) throw interestsError;
        
        setInterests(interestsData || []);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);
  
  const handleSaveProfile = async () => {
    if (!user || !editedProfile) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editedProfile)
        .eq('id', user.id);
        
      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...editedProfile } : null);
      setEditMode(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };
  
  const handleAddInterest = async () => {
    if (!user || !newInterest) return;
    
    try {
      const { data, error } = await supabase
        .from('user_interests')
        .insert({
          user_id: user.id,
          category: newInterest
        })
        .select();
        
      if (error) throw error;
      
      setInterests([...interests, data[0]]);
      setNewInterest('');
      
      toast({
        title: "Interest added",
        description: "Your interest has been added successfully"
      });
    } catch (error: any) {
      console.error('Error adding interest:', error);
      
      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        toast({
          title: "Interest already exists",
          description: "You've already added this interest",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add interest",
          variant: "destructive"
        });
      }
    }
  };
  
  const handleRemoveInterest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_interests')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setInterests(interests.filter(interest => interest.id !== id));
      
      toast({
        title: "Interest removed",
        description: "Your interest has been removed"
      });
    } catch (error) {
      console.error('Error removing interest:', error);
      toast({
        title: "Error",
        description: "Failed to remove interest",
        variant: "destructive"
      });
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto p-4 text-center">
          <p>Loading profile...</p>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} />
              ) : (
                <AvatarFallback>{profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}</AvatarFallback>
              )}
            </Avatar>
            <Button 
              size="icon" 
              variant="secondary" 
              className="absolute bottom-0 right-0 rounded-full"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold">{profile?.full_name || 'Your Name'}</h1>
            <p className="text-muted-foreground">
              {profile?.field_of_study ? 
                `${profile.field_of_study} Student` : 
                'Earth Science Student'}
            </p>
          </div>
          <Button variant="outline" onClick={() => setEditMode(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        {/* Profile Information */}
        <div className="grid gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={user?.email || ""} 
                  readOnly 
                  className="bg-gray-100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="major">Field of Study</Label>
                <Input 
                  id="major" 
                  value={profile?.field_of_study || "Earth Science - Hydrology and Water Resources"} 
                  readOnly 
                  className="bg-gray-100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="year">Year</Label>
                <Input 
                  id="year" 
                  value={profile?.study_year ? `Year ${profile.study_year}` : "First Year"} 
                  readOnly 
                  className="bg-gray-100"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Interests</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Interest
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add an Interest</DialogTitle>
                    <DialogDescription>
                      Add your academic interests to find similar students
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <Label htmlFor="interest">Select an interest</Label>
                    <select 
                      id="interest"
                      className="w-full p-2 border rounded-md"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                    >
                      <option value="" disabled>Select interest...</option>
                      {allInterests.map(interest => (
                        <option key={interest.value} value={interest.value}>
                          {interest.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddInterest} disabled={!newInterest}>
                      Add Interest
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {interests.length === 0 ? (
                <p className="text-muted-foreground">No interests added yet. Add some to connect with similar students.</p>
              ) : (
                interests.map((interest) => {
                  // Find the label for this interest
                  const interestInfo = allInterests.find(i => i.value === interest.category);
                  
                  return (
                    <Badge 
                      key={interest.id} 
                      variant="secondary"
                      className="px-3 py-1 flex items-center gap-1"
                    >
                      {interestInfo?.label || interest.category}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4 ml-1 rounded-full p-0"
                        onClick={() => handleRemoveInterest(interest.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                value={editedProfile.full_name || ""}
                onChange={(e) => setEditedProfile({...editedProfile, full_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldOfStudy">Field of Study</Label>
              <Input 
                id="fieldOfStudy" 
                value={editedProfile.field_of_study || ""}
                onChange={(e) => setEditedProfile({...editedProfile, field_of_study: e.target.value})}
                placeholder="e.g., Earth Science - Hydrology and Water Resources"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studyYear">Year of Study</Label>
              <select
                id="studyYear"
                className="w-full p-2 border rounded-md"
                value={editedProfile.study_year || ""}
                onChange={(e) => setEditedProfile({
                  ...editedProfile, 
                  study_year: e.target.value ? parseInt(e.target.value) : null
                })}
              >
                <option value="">Select year...</option>
                {[1, 2, 3, 4, 5, 6].map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMode(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Profile;
