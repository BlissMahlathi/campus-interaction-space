
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Edit, Plus, Upload, Users, BookOpen, Bell } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  member_count: number;
}

interface Resource {
  id: string;
  title: string;
  department: string;
  resource_type: string;
  file_url: string;
  created_at: string;
  created_by: string;
  status: 'pending' | 'approved' | 'rejected';
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  const [newResource, setNewResource] = useState({
    title: '',
    department: '',
    resource_type: '',
    file: null as File | null
  });
  
  const [newStudyGroup, setNewStudyGroup] = useState({
    name: '',
    description: '',
  });

  // Protect admin route
  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    
    if (!isAdmin) {
      navigate('/hub');
      toast({
        title: "Access Denied",
        description: "You do not have permission to access the admin page",
        variant: "destructive"
      });
      return;
    }
    
    fetchAnnouncements();
    fetchResources();
    fetchStudyGroups();
  }, [user, isAdmin, navigate]);

  // Fetch data functions
  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive"
      });
    }
  };
  
  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive"
      });
    }
  };
  
  const fetchStudyGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select('*, profiles!study_groups_created_by_fkey(full_name)');
      
      if (error) throw error;
      
      const formattedGroups = data?.map(group => ({
        ...group,
        member_count: 0, // This would be populated from a count query in a real app
      })) || [];
      
      setStudyGroups(formattedGroups);
    } catch (error: any) {
      console.error('Error fetching study groups:', error);
      toast({
        title: "Error",
        description: "Failed to load study groups",
        variant: "destructive"
      });
    }
  };

  // Announcement CRUD operations
  const handleAddAnnouncement = async () => {
    try {
      if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
        toast({
          title: "Validation Error",
          description: "Title and content are required",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          created_by: user?.id
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Announcement created successfully"
      });
      
      setAnnouncements([...(data || []), ...announcements]);
      setNewAnnouncement({ title: '', content: '' });
    } catch (error: any) {
      console.error('Error adding announcement:', error);
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive"
      });
    }
  };
  
  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement) return;
    
    try {
      const { error } = await supabase
        .from('announcements')
        .update({
          title: editingAnnouncement.title,
          content: editingAnnouncement.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAnnouncement.id);
      
      if (error) throw error;
      
      setAnnouncements(announcements.map(a => 
        a.id === editingAnnouncement.id ? editingAnnouncement : a
      ));
      
      setEditingAnnouncement(null);
      
      toast({
        title: "Success",
        description: "Announcement updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating announcement:', error);
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setAnnouncements(announcements.filter(a => a.id !== id));
      
      toast({
        title: "Success",
        description: "Announcement deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive"
      });
    }
  };

  // Resource management
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewResource({
        ...newResource,
        file: e.target.files[0]
      });
    }
  };
  
  const handleUploadResource = async () => {
    try {
      if (!newResource.title || !newResource.department || !newResource.resource_type || !newResource.file) {
        toast({
          title: "Validation Error",
          description: "All fields and a file are required",
          variant: "destructive"
        });
        return;
      }
      
      // Upload file to Supabase Storage
      const fileExt = newResource.file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `resources/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, newResource.file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);
      
      // Add resource record to database
      const { error } = await supabase
        .from('resources')
        .insert({
          title: newResource.title,
          department: newResource.department,
          resource_type: newResource.resource_type,
          file_url: publicUrl,
          created_by: user?.id,
          status: 'approved' // Auto-approve when admin uploads
        });
      
      if (error) throw error;
      
      fetchResources(); // Refresh the resources list
      
      // Reset form
      setNewResource({
        title: '',
        department: '',
        resource_type: '',
        file: null
      });
      
      toast({
        title: "Success",
        description: "Resource uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error uploading resource:', error);
      toast({
        title: "Error",
        description: "Failed to upload resource",
        variant: "destructive"
      });
    }
  };
  
  const handleApproveResource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ status: 'approved' })
        .eq('id', id);
      
      if (error) throw error;
      
      setResources(resources.map(r => r.id === id ? { ...r, status: 'approved' } : r));
      
      toast({
        title: "Success",
        description: "Resource approved successfully"
      });
    } catch (error: any) {
      console.error('Error approving resource:', error);
      toast({
        title: "Error",
        description: "Failed to approve resource",
        variant: "destructive"
      });
    }
  };
  
  const handleRejectResource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ status: 'rejected' })
        .eq('id', id);
      
      if (error) throw error;
      
      setResources(resources.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
      
      toast({
        title: "Success",
        description: "Resource rejected"
      });
    } catch (error: any) {
      console.error('Error rejecting resource:', error);
      toast({
        title: "Error",
        description: "Failed to reject resource",
        variant: "destructive"
      });
    }
  };

  // Study group management
  const handleCreateStudyGroup = async () => {
    try {
      if (!newStudyGroup.name || !newStudyGroup.description) {
        toast({
          title: "Validation Error",
          description: "Name and description are required",
          variant: "destructive"
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('study_groups')
        .insert({
          name: newStudyGroup.name,
          description: newStudyGroup.description,
          created_by: user?.id
        })
        .select();
      
      if (error) throw error;
      
      fetchStudyGroups(); // Refresh the study groups list
      
      // Reset form
      setNewStudyGroup({
        name: '',
        description: ''
      });
      
      toast({
        title: "Success",
        description: "Study group created successfully"
      });
    } catch (error: any) {
      console.error('Error creating study group:', error);
      toast({
        title: "Error",
        description: "Failed to create study group",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          
          <Tabs defaultValue="announcements" className="w-full">
            <TabsList className="mb-4 w-full justify-start">
              <TabsTrigger value="announcements" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Announcements
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Resources
              </TabsTrigger>
              <TabsTrigger value="studyGroups" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Study Groups
              </TabsTrigger>
            </TabsList>
            
            {/* Announcements Tab */}
            <TabsContent value="announcements" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Announcement</CardTitle>
                  <CardDescription>Create announcements to be shown to all students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Input
                        placeholder="Announcement Title"
                        value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Announcement Content"
                        className="min-h-[100px]"
                        value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddAnnouncement} className="w-full md:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Announcement
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Manage Announcements</CardTitle>
                  <CardDescription>Edit or delete existing announcements</CardDescription>
                </CardHeader>
                <CardContent>
                  {announcements.length === 0 ? (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">No announcements yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {announcements.map((announcement) => (
                          <TableRow key={announcement.id}>
                            <TableCell className="font-medium">{announcement.title}</TableCell>
                            <TableCell>{new Date(announcement.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit Announcement</DialogTitle>
                                      <DialogDescription>
                                        Make changes to the announcement below
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <Input
                                        placeholder="Title"
                                        value={editingAnnouncement?.title || ''}
                                        onChange={(e) => setEditingAnnouncement(prev => prev ? { ...prev, title: e.target.value } : null)}
                                      />
                                      <Textarea
                                        placeholder="Content"
                                        className="min-h-[100px]"
                                        value={editingAnnouncement?.content || ''}
                                        onChange={(e) => setEditingAnnouncement(prev => prev ? { ...prev, content: e.target.value } : null)}
                                      />
                                    </div>
                                    <DialogFooter>
                                      <Button onClick={handleUpdateAnnouncement}>Save Changes</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload New Resource</CardTitle>
                  <CardDescription>Upload academic resources for students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Input
                        placeholder="Resource Title"
                        value={newResource.title}
                        onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Department (e.g., Mathematics, Computer Science)"
                        value={newResource.department}
                        onChange={(e) => setNewResource({ ...newResource, department: e.target.value })}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Resource Type (e.g., Study Guide, Notes, Past Exam)"
                        value={newResource.resource_type}
                        onChange={(e) => setNewResource({ ...newResource, resource_type: e.target.value })}
                      />
                    </div>
                    <div>
                      <Input
                        type="file"
                        onChange={handleFileChange}
                      />
                    </div>
                    <Button onClick={handleUploadResource} className="w-full md:w-auto">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Resource
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Manage Resources</CardTitle>
                  <CardDescription>Approve or reject submitted resources</CardDescription>
                </CardHeader>
                <CardContent>
                  {resources.length === 0 ? (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">No resources yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resources.map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell className="font-medium">{resource.title}</TableCell>
                            <TableCell>{resource.department}</TableCell>
                            <TableCell>{resource.resource_type}</TableCell>
                            <TableCell>
                              <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium 
                                ${resource.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                  resource.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                  'bg-yellow-100 text-yellow-800'}`}>
                                {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {resource.status === 'pending' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                                      onClick={() => handleApproveResource(resource.id)}
                                    >
                                      Approve
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                                      onClick={() => handleRejectResource(resource.id)}
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
                                <a 
                                  href={resource.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
                                >
                                  <BookOpen className="h-4 w-4" />
                                </a>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Study Groups Tab */}
            <TabsContent value="studyGroups" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Study Group</CardTitle>
                  <CardDescription>Create study groups for students to join</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Input
                        placeholder="Group Name"
                        value={newStudyGroup.name}
                        onChange={(e) => setNewStudyGroup({ ...newStudyGroup, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Group Description"
                        className="min-h-[100px]"
                        value={newStudyGroup.description}
                        onChange={(e) => setNewStudyGroup({ ...newStudyGroup, description: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleCreateStudyGroup} className="w-full md:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Study Group
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Manage Study Groups</CardTitle>
                  <CardDescription>View and manage existing study groups</CardDescription>
                </CardHeader>
                <CardContent>
                  {studyGroups.length === 0 ? (
                    <div className="text-center p-4">
                      <p className="text-muted-foreground">No study groups yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Members</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studyGroups.map((group) => (
                          <TableRow key={group.id}>
                            <TableCell className="font-medium">{group.name}</TableCell>
                            <TableCell>{group.description}</TableCell>
                            <TableCell>{group.member_count}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminPage;
