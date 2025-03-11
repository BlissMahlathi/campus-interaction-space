
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Users, Clock, Calendar, MapPin, Book, User } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu";

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  memberCount?: number;
  isAdmin?: boolean;
  isMember?: boolean;
}

interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: string;
  joined_at: string;
  profile?: {
    full_name: string;
    avatar_url: string;
  };
}

const StudyGroups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  });
  
  // Fetch all study groups and identify the user's groups
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch all study groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('study_groups')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (groupsError) throw groupsError;
        
        // Fetch group memberships for the current user
        const { data: membershipsData, error: membershipError } = await supabase
          .from('study_group_members')
          .select('group_id, role')
          .eq('user_id', user.id);
          
        if (membershipError) throw membershipError;
        
        // Create a map of group IDs to membership info
        const userMemberships = new Map();
        membershipsData?.forEach(membership => {
          userMemberships.set(membership.group_id, membership.role);
        });
        
        // Process all groups
        const processedGroups = groupsData?.map(group => ({
          ...group,
          created_at: new Date(group.created_at).toLocaleDateString(),
          isAdmin: group.created_by === user.id || userMemberships.get(group.id) === 'admin',
          isMember: userMemberships.has(group.id)
        })) || [];
        
        // Set all groups
        setGroups(processedGroups);
        
        // Filter for my groups
        const userGroups = processedGroups.filter(
          group => group.created_by === user.id || userMemberships.has(group.id)
        );
        setMyGroups(userGroups);
      } catch (error) {
        console.error('Error fetching study groups:', error);
        toast({
          title: 'Error',
          description: 'Failed to load study groups',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroups();
    
    // Set up realtime subscription for study groups
    const groupsChannel = supabase
      .channel('public:study_groups')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'study_groups' }, 
        () => {
          fetchGroups();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(groupsChannel);
    };
  }, [user, toast]);
  
  // Create a new study group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!newGroup.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a group name',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Create the group
      const { data, error } = await supabase
        .from('study_groups')
        .insert({
          name: newGroup.name,
          description: newGroup.description,
          created_by: user.id
        })
        .select();
        
      if (error) throw error;
      
      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('study_group_members')
        .insert({
          group_id: data[0].id,
          user_id: user.id,
          role: 'admin'
        });
        
      if (memberError) throw memberError;
      
      toast({
        title: 'Success',
        description: 'Study group created successfully'
      });
      
      setShowCreateDialog(false);
      setNewGroup({ name: '', description: '' });
      
      // Navigate to the new group
      navigate(`/study-groups/${data[0].id}`);
    } catch (error: any) {
      console.error('Error creating study group:', error);
      toast({
        title: 'Error',
        description: 'Failed to create study group',
        variant: 'destructive'
      });
    }
  };
  
  // Join a study group
  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('study_group_members')
        .insert({
          group_id: groupId,
          user_id: user.id
        });
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'You have joined the group'
      });
      
      // Update local state
      setGroups(groups.map(group => 
        group.id === groupId ? { ...group, isMember: true } : group
      ));
      
      // Update myGroups
      const joinedGroup = groups.find(g => g.id === groupId);
      if (joinedGroup) {
        setMyGroups([...myGroups, { ...joinedGroup, isMember: true }]);
      }
    } catch (error: any) {
      console.error('Error joining group:', error);
      toast({
        title: 'Error',
        description: 'Failed to join group',
        variant: 'destructive'
      });
    }
  };
  
  // Leave a study group
  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('study_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'You have left the group'
      });
      
      // Update local state
      setGroups(groups.map(group => 
        group.id === groupId ? { ...group, isMember: false } : group
      ));
      
      // Remove from myGroups
      setMyGroups(myGroups.filter(group => group.id !== groupId));
    } catch (error: any) {
      console.error('Error leaving group:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave group',
        variant: 'destructive'
      });
    }
  };
  
  // View group details and members
  const handleViewGroupDetails = async (group: StudyGroup) => {
    setSelectedGroup(group);
    
    try {
      const { data, error } = await supabase
        .from('study_group_members')
        .select(`
          *,
          profile:profiles(full_name, avatar_url)
        `)
        .eq('group_id', group.id);
        
      if (error) throw error;
      
      setGroupMembers(data || []);
    } catch (error) {
      console.error('Error fetching group members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load group members',
        variant: 'destructive'
      });
    }
  };
  
  // Filter groups based on search term
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 px-4">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Study Groups</h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input 
                placeholder="Search study groups..." 
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {user && (
              <Button className="w-full sm:w-auto" onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Study Group
              </Button>
            )}
          </div>
          
          {/* My Groups Section */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">My Study Groups</h2>
            {!user ? (
              <Card className="bg-card p-6 text-center">
                <p className="text-muted-foreground">Please sign in to view your study groups</p>
              </Card>
            ) : loading ? (
              <Card className="bg-card p-6 text-center">
                <p className="text-muted-foreground">Loading your groups...</p>
              </Card>
            ) : myGroups.length === 0 ? (
              <Card className="bg-card p-6 text-center">
                <p className="text-muted-foreground">You haven't joined any study groups yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowCreateDialog(true)}
                >
                  Create Your First Group
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myGroups.map((group) => (
                  <Card key={group.id} className="overflow-hidden">
                    <CardHeader className="bg-secondary/50">
                      <CardTitle className="truncate">{group.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                        {group.description || "No description provided."}
                      </p>
                      <div className="mt-4 flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Created: {group.created_at}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between p-4 pt-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewGroupDetails(group)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      {group.isAdmin && (
                        <Badge variant="outline">Admin</Badge>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </section>
          
          {/* All Groups Section */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Discover Study Groups</h2>
            {loading ? (
              <Card className="bg-card p-6 text-center">
                <p className="text-muted-foreground">Loading study groups...</p>
              </Card>
            ) : filteredGroups.length === 0 ? (
              <Card className="bg-card p-6 text-center">
                <p className="text-muted-foreground">No study groups found</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGroups.map((group) => (
                  <Card key={group.id} className="overflow-hidden">
                    <CardHeader className="bg-secondary/50">
                      <CardTitle className="truncate">{group.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                        {group.description || "No description provided."}
                      </p>
                      <div className="mt-4 flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Created: {group.created_at}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between p-4 pt-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewGroupDetails(group)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      {user && !group.isMember ? (
                        <Button 
                          size="sm"
                          onClick={() => handleJoinGroup(group.id)}
                        >
                          Join Group
                        </Button>
                      ) : user && group.isMember && !group.isAdmin ? (
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleLeaveGroup(group.id)}
                        >
                          Leave
                        </Button>
                      ) : (
                        group.isAdmin && <Badge variant="outline">Admin</Badge>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      
      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Study Group</DialogTitle>
            <DialogDescription>
              Start a new study group for your course or interest area
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGroup}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Group Name</label>
                <Input
                  id="name"
                  placeholder="e.g., Calculus Study Group"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  placeholder="Describe your study group's focus, meeting schedule, etc."
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Group</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Group Details Dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
        <DialogContent className="max-w-md">
          {selectedGroup && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedGroup.name}</DialogTitle>
                <DialogDescription>
                  {selectedGroup.description || "No description provided."}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <h3 className="text-sm font-medium mb-2">Group Members</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {groupMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {member.profile?.avatar_url ? (
                            <AvatarImage src={member.profile.avatar_url} />
                          ) : (
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm">{member.profile?.full_name || "Anonymous"}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {member.role === 'admin' ? 'Admin' : 'Member'}
                      </Badge>
                    </div>
                  ))}
                  
                  {groupMembers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">No members found</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                {selectedGroup.isMember && !selectedGroup.isAdmin ? (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      handleLeaveGroup(selectedGroup.id);
                      setSelectedGroup(null);
                    }}
                  >
                    Leave Group
                  </Button>
                ) : !selectedGroup.isMember ? (
                  <Button
                    onClick={() => {
                      handleJoinGroup(selectedGroup.id);
                      setSelectedGroup(null);
                    }}
                  >
                    Join Group
                  </Button>
                ) : null}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default StudyGroups;
