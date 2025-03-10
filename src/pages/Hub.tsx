
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, BookOpen, Users, Bell, ThumbsUp, 
  MessageCircle, Share2, Trash2, Edit2, Upload, 
  MoreVertical 
} from "lucide-react";
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
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useIsMobile } from '@/hooks/use-mobile';
import FriendRequests from '@/components/FriendRequests';
import FriendSuggestions from '@/components/FriendSuggestions';

interface Post {
  id: string;
  author: string;
  author_id: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: Comment[];
  userLiked: boolean;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

const Hub = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState<{[key: string]: string}>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;

        const formattedPosts: Post[] = data ? data.map(post => ({
          id: post.id,
          author: post.author_name || 'Anonymous',
          author_id: post.user_id,
          content: post.content,
          timestamp: new Date(post.created_at).toLocaleString(),
          likes: post.likes || 0,
          comments: [],
          userLiked: false
        })) : [];
        
        setPosts(formattedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
        
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          author_name: profile?.full_name || user.email,
          content: newPostContent,
          likes: 0
        })
        .select();
      
      if (error) throw error;
      
      const newPost: Post = {
        id: data[0].id,
        author: profile?.full_name || user.email || 'Anonymous',
        author_id: user.id,
        content: newPostContent,
        timestamp: 'Just now',
        likes: 0,
        comments: [],
        userLiked: false
      };
      
      setPosts([newPost, ...posts]);
      setNewPostContent("");
      
      toast({
        title: "Post created",
        description: "Your post has been published successfully"
      });
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !editingPost.content.trim() || !user) return;
    
    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: editingPost.content })
        .eq('id', editingPost.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setPosts(posts.map(post => 
        post.id === editingPost.id ? editingPost : post
      ));
      
      setEditingPost(null);
      
      toast({
        title: "Post updated",
        description: "Your post has been updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive" 
      });
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setPosts(posts.filter(post => post.id !== id));
      
      toast({
        title: "Post deleted",
        description: "Your post has been deleted"
      });
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive"
      });
    }
  };

  const handleLikePost = (id: string) => {
    // For a future implementation with database
    setPosts(posts.map(post => {
      if (post.id === id) {
        return {
          ...post,
          likes: post.userLiked ? post.likes - 1 : post.likes + 1,
          userLiked: !post.userLiked
        };
      }
      return post;
    }));
  };

  const handleAddComment = (postId: string) => {
    if (!commentText[postId]?.trim()) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      author: "You", // In a real app, this would be the current user
      content: commentText[postId],
      timestamp: "Just now"
    };
    
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));
    
    setCommentText({...commentText, [postId]: ""});
  };

  const handleSharePost = (id: string) => {
    const url = `${window.location.origin}/hub/post/${id}`;
    
    if (navigator.share && isMobile) {
      navigator.share({
        title: 'Check out this post on CampusSpace',
        text: 'I found an interesting post on CampusSpace',
        url
      })
      .then(() => {
        toast({
          title: "Post shared",
          description: "Post shared successfully"
        });
      })
      .catch((error) => {
        console.error('Error sharing:', error);
        copyToClipboard(url);
      });
    } else {
      copyToClipboard(url);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Link copied",
          description: "Post link has been copied to your clipboard"
        });
      },
      () => {
        toast({
          title: "Error",
          description: "Failed to copy link to clipboard",
          variant: "destructive"
        });
      }
    );
  };

  const handleResourceUpload = () => {
    toast({
      title: "Upload successful",
      description: "Your resource has been uploaded and is pending review"
    });
  };

  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const EmptyState = () => (
    <div className="bg-card p-6 rounded-lg border text-center space-y-3">
      <h3 className="text-lg font-medium">Welcome to the Info Hub!</h3>
      <p className="text-muted-foreground">
        This is where you can share resources, ask questions, and connect with other students. 
        Be the first to create a post!
      </p>
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Information Hub</h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                className="pl-10" 
                placeholder="Search resources, posts, or study groups..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Resource
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Study Resource</DialogTitle>
                  <DialogDescription>
                    Share academic materials with your fellow students
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">Title</label>
                    <Input id="title" placeholder="e.g., Calculus Final Exam Study Guide" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="department" className="text-sm font-medium">Department</label>
                    <Input id="department" placeholder="e.g., Mathematics" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="resourceType" className="text-sm font-medium">Resource Type</label>
                    <Input id="resourceType" placeholder="e.g., Study Guide, Course Notes" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="fileUpload" className="text-sm font-medium">File</label>
                    <Input id="fileUpload" type="file" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleResourceUpload}>Upload</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post Section */}
            {user && (
              <section className="bg-card p-6 rounded-lg border">
                <h2 className="text-xl font-semibold mb-4">Create a Post</h2>
                <div className="space-y-4">
                  <Textarea 
                    placeholder="Share something with your fellow students..." 
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleCreatePost}>Post</Button>
                  </div>
                </div>
              </section>
            )}

            {/* Posts Feed */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Recent Posts</h2>
              
              {loading ? (
                <div className="bg-card p-6 rounded-lg border text-center">
                  <p className="text-muted-foreground">Loading posts...</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <div key={post.id} className="bg-card p-6 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{post.author}</h3>
                          <p className="text-sm text-muted-foreground">{post.timestamp}</p>
                        </div>
                        {post.author_id === user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingPost(post)}>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      
                      <div className="my-4">
                        <p>{post.content}</p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleLikePost(post.id)}
                          className={post.userLiked ? "text-primary" : ""}
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          {post.likes} {post.likes === 1 ? "Like" : "Likes"}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          {post.comments.length} {post.comments.length === 1 ? "Comment" : "Comments"}
                        </Button>
                        <div className="ml-auto">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSharePost(post.id)}
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            {!isMobile && "Share"}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Comments section */}
                      {post.comments.length > 0 && (
                        <div className="mt-4 pl-4 border-l space-y-3">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="bg-accent p-3 rounded-md">
                              <div className="flex justify-between items-center">
                                <h4 className="text-sm font-medium">{comment.author}</h4>
                                <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                              </div>
                              <p className="text-sm mt-1">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Add comment */}
                      {user && (
                        <div className="mt-4 flex gap-2">
                          <Input 
                            placeholder="Write a comment..." 
                            value={commentText[post.id] || ""}
                            onChange={(e) => setCommentText({...commentText, [post.id]: e.target.value})}
                          />
                          <Button size="sm" onClick={() => handleAddComment(post.id)}>
                            Comment
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            {/* Friend Requests Section */}
            {user && <FriendRequests />}

            {/* Friend Suggestions */}
            {user && <FriendSuggestions />}

            {/* Resources Section */}
            <section className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Academic Resources</h2>
                </div>
              </div>
              <div className="text-center py-6">
                <p className="text-muted-foreground">Resources coming soon!</p>
                <p className="text-sm mt-2">Upload your study materials to share with others.</p>
              </div>
            </section>

            {/* Study Groups Section */}
            <section className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Study Groups</h2>
                </div>
              </div>
              <div className="text-center py-6">
                <p className="text-muted-foreground">Study groups coming soon!</p>
                <p className="text-sm mt-2">Create or join study groups to collaborate with peers.</p>
              </div>
            </section>

            {/* Announcements Section */}
            <section className="bg-card rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Announcements</h2>
              </div>
              <div className="text-center py-6">
                <p className="text-muted-foreground">No announcements yet</p>
                <p className="text-sm mt-2">Important university announcements will appear here.</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Edit Post Dialog */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <Textarea 
            value={editingPost?.content || ""}
            onChange={(e) => setEditingPost(editingPost ? {...editingPost, content: e.target.value} : null)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePost}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Hub;
