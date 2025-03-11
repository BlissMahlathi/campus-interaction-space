
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Search, UserPlus, Bookmark, BookmarkCheck } from "lucide-react";
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  creator_name: string;
  member_count: number;
  joined: boolean;
}

const StudyGroups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchStudyGroups();
    }
  }, [user]);

  const fetchStudyGroups = async () => {
    try {
      setLoading(true);
      
      // Fetch study groups
      const { data: groups, error } = await supabase
        .from('study_groups')
        .select(`
          *,
          profiles!study_groups_created_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch user's joined groups to know which ones they're already in
      const { data: userGroups, error: userGroupsError } = await supabase
        .from('study_group_members')
        .select('study_group_id')
        .eq('user_id', user?.id);
      
      if (userGroupsError) throw userGroupsError;
      
      const userGroupIds = (userGroups || []).map(ug => ug.study_group_id);
      
      // Format groups with additional info
      const formattedGroups = (groups || []).map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        created_at: group.created_at,
        created_by: group.created_by,
        creator_name: group.profiles?.full_name || 'Unknown',
        member_count: 0, // In a real app, we'd count members
        joined: userGroupIds.includes(group.id)
      }));
      
      setStudyGroups(formattedGroups);
    } catch (error: any) {
      console.error('Error fetching study groups:', error);
      toast({
        title: "Error",
        description: "Failed to load study groups",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      if (!newGroupData.name.trim() || !newGroupData.description.trim()) {
        toast({
          title: "Missing Information",
          description: "Please provide both a name and description",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('study_groups')
        .insert({
          name: newGroupData.name,
          description: newGroupData.description,
          created_by: user?.id
        })
        .select();
      
      if (error) throw error;
      
      // Also join the created group automatically
      await supabase
        .from('study_group_members')
        .insert({
          study_group_id: data?.[0]?.id,
          user_id: user?.id,
          role: 'admin'
        });
      
      toast({
        title: "Success",
        description: "Study group created successfully",
      });
      
      setNewGroupData({ name: '', description: '' });
      fetchStudyGroups();
    } catch (error: any) {
      console.error('Error creating study group:', error);
      toast({
        title: "Error",
        description: "Failed to create study group",
        variant: "destructive"
      });
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('study_group_members')
        .insert({
          study_group_id: groupId,
          user_id: user?.id,
          role: 'member'
        });
      
      if (error) throw error;
      
      setStudyGroups(studyGroups.map(group => 
        group.id === groupId ? { ...group, joined: true, member_count: group.member_count + 1 } : group
      ));
      
      toast({
        title: "Joined",
        description: "You have successfully joined the study group",
      });
    } catch (error: any) {
      console.error('Error joining study group:', error);
      toast({
        title: "Error",
        description: "Failed to join the study group",
        variant: "destructive"
      });
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('study_group_members')
        .delete()
        .eq('study_group_id', groupId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      setStudyGroups(studyGroups.map(group => 
        group.id === groupId ? { ...group, joined: false, member_count: Math.max(0, group.member_count - 1) } : group
      ));
      
      toast({
        title: "Left",
        description: "You have left the study group",
      });
    } catch (error: any) {
      console.error('Error leaving study group:', error);
      toast({
        title: "Error",
        description: "Failed to leave the study group",
        variant: "destructive"
      });
    }
  };

  const filteredGroups = studyGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Study Groups
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                className="pl-10" 
                placeholder="Search study groups..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Study Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a Study Group</DialogTitle>
                  <DialogDescription>
                    Create a new study group for you and your classmates
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Input 
                      placeholder="Group Name" 
                      value={newGroupData.name}
                      onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="Description" 
                      className="min-h-[100px]"
                      value={newGroupData.description}
                      onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateGroup}>Create Group</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Loading study groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium">No study groups found</h3>
            {searchTerm ? (
              <p className="text-muted-foreground mt-2">No groups match your search. Try a different term or create a new group.</p>
            ) : (
              <p className="text-muted-foreground mt-2">Get started by creating the first study group!</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map(group => (
              <Card key={group.id} className="flex flex-col h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                    {group.joined ? (
                      <BookmarkCheck className="h-5 w-5 text-primary" />
                    ) : (
                      <Bookmark className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <CardDescription>
                    Created by {group.creator_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground">{group.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t pt-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {group.member_count} members
                  </div>
                  {group.joined ? (
                    <Button 
                      variant="outline" 
                      onClick={() => handleLeaveGroup(group.id)}
                      size="sm"
                    >
                      Leave Group
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleJoinGroup(group.id)}
                      size="sm"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Join Group
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default StudyGroups;
