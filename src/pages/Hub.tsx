
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Search, BookOpen, Users, Bell, ArrowRight, ThumbsUp, MessageCircle, Share2, Trash2, Edit2, Upload } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

interface Post {
  id: string;
  author: string;
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

interface Resource {
  id: string;
  title: string;
  type: string;
  department: string;
  downloads: number;
  author: string;
  fileUrl?: string;
}

const Hub = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      author: "John Doe",
      content: "Just uploaded new study notes for Computer Science 101. Check them out in the resources section!",
      timestamp: "2 hours ago",
      likes: 24,
      comments: [
        {
          id: "c1",
          author: "Jane Smith",
          content: "Thanks for sharing! These are really helpful.",
          timestamp: "1 hour ago"
        }
      ],
      userLiked: false
    },
    {
      id: "2",
      author: "Alice Johnson",
      content: "There's a career fair next week at the main hall. Don't miss this opportunity to network with potential employers!",
      timestamp: "5 hours ago",
      likes: 42,
      comments: [],
      userLiked: true
    }
  ]);
  
  const [newPostContent, setNewPostContent] = useState("");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState<{[key: string]: string}>({});
  const [searchTerm, setSearchTerm] = useState("");

  const resources = [
    {
      id: "r1",
      title: "Introduction to Computer Science",
      type: "Course Notes",
      department: "Computer Science",
      downloads: 234,
      author: "Prof. Smith"
    },
    {
      id: "r2",
      title: "Calculus II Study Guide",
      type: "Study Guide",
      department: "Mathematics",
      downloads: 189,
      author: "Jane Doe"
    },
    {
      id: "r3",
      title: "Physics Lab Manual",
      type: "Lab Material",
      department: "Physics",
      downloads: 156,
      author: "Dr. Johnson"
    }
  ];

  const studyGroups = [
    {
      title: "Advanced Algorithms Study Group",
      members: 12,
      nextMeeting: "Tomorrow at 3 PM",
      location: "Library Room 204"
    },
    {
      title: "Chemistry Lab Prep Group",
      members: 8,
      nextMeeting: "Wednesday at 5 PM",
      location: "Science Building 102"
    }
  ];

  const announcements = [
    {
      title: "Library Extended Hours",
      date: "2024-02-15",
      content: "The library will remain open 24/7 during finals week."
    },
    {
      title: "New Study Resources Available",
      date: "2024-02-14",
      content: "Check out our new collection of online study materials."
    }
  ];

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    
    const newPost: Post = {
      id: Date.now().toString(),
      author: "You", // In a real app, this would be the current user
      content: newPostContent,
      timestamp: "Just now",
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
  };

  const handleUpdatePost = () => {
    if (!editingPost || !editingPost.content.trim()) return;
    
    setPosts(posts.map(post => 
      post.id === editingPost.id ? editingPost : post
    ));
    
    setEditingPost(null);
    
    toast({
      title: "Post updated",
      description: "Your post has been updated successfully"
    });
  };

  const handleDeletePost = (id: string) => {
    setPosts(posts.filter(post => post.id !== id));
    
    toast({
      title: "Post deleted",
      description: "Your post has been deleted"
    });
  };

  const handleLikePost = (id: string) => {
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
    // In a real app, this would open a sharing dialog
    toast({
      title: "Post shared",
      description: "Post sharing link has been copied to your clipboard"
    });
  };

  const handleResourceUpload = () => {
    // In a real app, this would handle file uploads
    toast({
      title: "Upload successful",
      description: "Your resource has been uploaded and is pending review"
    });
  };

  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
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

        {/* Create Post Section */}
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

        {/* Posts Feed */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Posts</h2>
          
          {filteredPosts.length === 0 ? (
            <div className="bg-card p-6 rounded-lg border text-center text-muted-foreground">
              No posts found matching your search.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-card p-6 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{post.author}</h3>
                      <p className="text-sm text-muted-foreground">{post.timestamp}</p>
                    </div>
                    {post.author === "You" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">⋮</Button>
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
                  
                  <div className="flex items-center gap-4 border-t pt-4">
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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleSharePost(post.id)}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
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
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Resources Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Academic Resources</h2>
            </div>
            <Button variant="ghost" className="text-primary">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => (
              <div 
                key={resource.id}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold">{resource.title}</h3>
                <p className="text-sm text-muted-foreground">{resource.type}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm">{resource.department}</span>
                  <span className="text-sm text-muted-foreground">{resource.downloads} downloads</span>
                </div>
                <p className="text-sm mt-1">By {resource.author}</p>
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  Download
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Study Groups Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Study Groups</h2>
            </div>
            <Button variant="ghost" className="text-primary">
              Create Group <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {studyGroups.map((group) => (
              <div 
                key={group.title}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold">{group.title}</h3>
                <p className="text-sm text-muted-foreground">{group.members} members</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">Next: {group.nextMeeting}</p>
                  <p className="text-sm text-muted-foreground">{group.location}</p>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  Join Group
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Announcements Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Announcements</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {announcements.map((announcement, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between flex-1 pr-4">
                    <span>{announcement.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(announcement.date).toLocaleDateString()}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">{announcement.content}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
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
