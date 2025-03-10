
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import MainLayout from '@/components/layout/MainLayout';
import { MessageCircle, Send, User, Menu, Image, Paperclip, UserPlus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import FriendRequests, { useFriendRequests, FriendStatus } from '@/components/FriendRequests';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  isOutgoing: boolean;
  media_url?: string;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  user_id: string;
}

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkFriendshipStatus, sendFriendRequest } = useFriendRequests();
  const [mediaAttachment, setMediaAttachment] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchFriends = async () => {
      try {
        const { data, error } = await supabase
          .from('friend_requests')
          .select(`
            id, 
            sender_id, 
            receiver_id,
            sender:profiles!friend_requests_sender_id_fkey(id, full_name, avatar_url),
            receiver:profiles!friend_requests_receiver_id_fkey(id, full_name, avatar_url)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq('status', FriendStatus.ACCEPTED);

        if (error) throw error;
        
        // Format friends data
        const friendsList = (data || []).map(item => {
          // If the current user is the sender, return receiver as friend
          if (item.sender_id === user.id) {
            return {
              id: item.receiver_id,
              name: item.receiver.full_name,
              avatar_url: item.receiver.avatar_url
            };
          }
          // If the current user is the receiver, return sender as friend
          return {
            id: item.sender_id,
            name: item.sender.full_name,
            avatar_url: item.sender.avatar_url
          };
        });
        
        setFriends(friendsList);
        
        // Create conversations from friends
        const conversationsList = friendsList.map(friend => ({
          id: friend.id,
          name: friend.name,
          lastMessage: "Start a conversation",
          timestamp: "Just now",
          unread: false,
          user_id: friend.id
        }));
        
        setConversations(conversationsList);
      } catch (error) {
        console.error('Error fetching friends:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFriends();
  }, [user]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !mediaAttachment) return;
    if (!user || !selectedConversation) return;
    
    try {
      let mediaUrl = null;
      
      // If there's a media attachment, upload it first
      if (mediaAttachment) {
        const fileExt = mediaAttachment.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `messages/${user.id}/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('media')
          .upload(filePath, mediaAttachment);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
          
        mediaUrl = publicUrl;
      }
      
      // Create a new message object
      const messageData = {
        sender_id: user.id,
        receiver_id: selectedConversation,
        content: newMessage,
        media_url: mediaUrl,
        read: false
      };
      
      const { error } = await supabase
        .from('messages')
        .insert(messageData);
        
      if (error) throw error;
      
      // Update local messages
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender_id: user.id,
        content: newMessage,
        timestamp: new Date().toLocaleTimeString(),
        isOutgoing: true,
        media_url: mediaUrl || undefined
      }]);
      
      setNewMessage("");
      setMediaAttachment(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaAttachment(e.target.files[0]);
    }
  };

  useEffect(() => {
    if (!selectedConversation || !user) return;
    
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedConversation}),and(sender_id.eq.${selectedConversation},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        setMessages((data || []).map(msg => ({
          id: msg.id,
          sender_id: msg.sender_id,
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString(),
          isOutgoing: msg.sender_id === user.id,
          media_url: msg.media_url
        })));
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('messages_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(and(sender_id=eq.${user.id},receiver_id=eq.${selectedConversation}),and(sender_id=eq.${selectedConversation},receiver_id=eq.${user.id}))`
      }, (payload) => {
        const newMsg = payload.new;
        setMessages(prev => [...prev, {
          id: newMsg.id,
          sender_id: newMsg.sender_id,
          content: newMsg.content,
          timestamp: new Date(newMsg.created_at).toLocaleTimeString(),
          isOutgoing: newMsg.sender_id === user.id,
          media_url: newMsg.media_url
        }]);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  const ConversationsList = () => (
    <div className="w-full h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
        </h2>
      </div>
      
      <div className="p-4">
        <FriendRequests />
      </div>
      
      <ScrollArea className="h-[calc(100vh-16rem)]">
        {isLoading ? (
          <div className="p-4 text-center">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No conversations yet. Add friends to start chatting!
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                selectedConversation === conversation.id ? "bg-accent" : ""
              }`}
              onClick={() => {
                setSelectedConversation(conversation.id);
                // On mobile, this should close the sidebar after selection
                const closeButton = document.querySelector('[data-sheet-close]');
                if (isMobile && closeButton) {
                  (closeButton as HTMLElement).click();
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{conversation.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {conversation.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
                {conversation.unread && (
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                )}
              </div>
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  );

  const AddFriend = () => {
    const [email, setEmail] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [foundUser, setFoundUser] = useState<any>(null);
    const [friendshipStatus, setFriendshipStatus] = useState<FriendStatus>(FriendStatus.NONE);
    
    const searchUser = async () => {
      if (!email.trim() || !user) return;
      
      setIsSearching(true);
      try {
        // Search for user by email
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setFoundUser(data);
          // Check friendship status
          const status = await checkFriendshipStatus(data.id);
          setFriendshipStatus(status);
        } else {
          setFoundUser(null);
          toast({
            title: 'User not found',
            description: 'No user found with that email address',
          });
        }
      } catch (error) {
        console.error('Error searching for user:', error);
        toast({
          title: 'Error',
          description: 'Failed to search for user',
          variant: 'destructive'
        });
      } finally {
        setIsSearching(false);
      }
    };
    
    return (
      <div className="p-4 border-t">
        <h3 className="font-medium mb-3">Add Friend</h3>
        <div className="flex gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1"
          />
          <Button onClick={searchUser} disabled={isSearching}>
            Search
          </Button>
        </div>
        
        {foundUser && (
          <div className="mt-4 p-3 bg-accent rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{foundUser.full_name}</p>
                  <p className="text-xs text-muted-foreground">{foundUser.email}</p>
                </div>
              </div>
              {friendshipStatus === FriendStatus.NONE && (
                <Button 
                  size="sm"
                  onClick={() => sendFriendRequest(foundUser.id)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add Friend
                </Button>
              )}
              {friendshipStatus === FriendStatus.PENDING && (
                <Button size="sm" variant="outline" disabled>
                  Request Pending
                </Button>
              )}
              {friendshipStatus === FriendStatus.ACCEPTED && (
                <Button size="sm" variant="outline" disabled>
                  Already Friends
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-2rem)] gap-4 -mt-6 -ml-6 -mr-6">
        {/* Mobile view with slide-out conversations */}
        {isMobile ? (
          <div className="flex-1 flex flex-col bg-white rounded-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">
                {selectedConversation
                  ? conversations.find((c) => c.id === selectedConversation)?.name
                  : "Messages"}
              </h3>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open conversations</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px]">
                  <ConversationsList />
                  <AddFriend />
                </SheetContent>
              </Sheet>
            </div>
            
            {selectedConversation ? (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isOutgoing ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 ${
                            message.isOutgoing
                              ? "bg-primary text-white"
                              : "bg-accent"
                          }`}
                        >
                          {message.media_url && (
                            <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                              <img 
                                src={message.media_url} 
                                alt="Attachment" 
                                className="max-w-full rounded-md"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://placehold.co/200x100?text=File';
                                }}
                              />
                            </a>
                          )}
                          <p>{message.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {message.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex gap-2">
                    {mediaAttachment && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-accent rounded-full text-sm">
                        <span className="truncate max-w-[100px]">{mediaAttachment.name}</span>
                        <button 
                          type="button" 
                          onClick={() => setMediaAttachment(null)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                      />
                      <Button type="button" variant="outline" size="icon">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </label>
                    <Button type="submit">
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send message</span>
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col p-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-center">Select a friend to start messaging</p>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  If you don't have any friends yet, add them using the menu button above
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop view with side-by-side layout */}
            <div className="w-80 border-r bg-white flex flex-col">
              <ConversationsList />
              <AddFriend />
            </div>

            <div className="flex-1 flex flex-col bg-white rounded-lg">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">
                      {conversations.find((c) => c.id === selectedConversation)?.name}
                    </h3>
                  </div>
                  
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.isOutgoing ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.isOutgoing
                                ? "bg-primary text-white"
                                : "bg-accent"
                            }`}
                          >
                            {message.media_url && (
                              <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                                <img 
                                  src={message.media_url} 
                                  alt="Attachment" 
                                  className="max-w-full rounded-md"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://placehold.co/200x100?text=File';
                                  }}
                                />
                              </a>
                            )}
                            <p>{message.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {message.timestamp}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex gap-2">
                      {mediaAttachment && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-accent rounded-full text-sm">
                          <span className="truncate max-w-[100px]">{mediaAttachment.name}</span>
                          <button 
                            type="button" 
                            onClick={() => setMediaAttachment(null)}
                            className="text-muted-foreground hover:text-primary"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1"
                      />
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleFileChange}
                        />
                        <Button type="button" variant="outline" size="icon">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </label>
                      <Button type="submit">
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send message</span>
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-center">Select a friend to start messaging</p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Add friends using the panel on the left
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Messages;
