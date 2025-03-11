
import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import MainLayout from '@/components/layout/MainLayout';
import { MessageCircle, Send, User, Menu, Image, Paperclip, UserPlus, XCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import FriendRequests, { useFriendRequests, FriendStatus } from '@/components/FriendRequests';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  isOutgoing: boolean;
  media_url?: string;
  sender_avatar?: string;
  sender_name?: string;
}

interface Conversation {
  id: string;
  name: string;
  avatar_url?: string;
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
  const [isSending, setIsSending] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkFriendshipStatus, sendFriendRequest } = useFriendRequests();
  const [mediaAttachment, setMediaAttachment] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
          const senderObj = item.sender as any;
          const receiverObj = item.receiver as any;
          
          // If the current user is the sender, return receiver as friend
          if (item.sender_id === user.id) {
            return {
              id: item.receiver_id,
              name: receiverObj.full_name,
              avatar_url: receiverObj.avatar_url
            };
          }
          // If the current user is the receiver, return sender as friend
          return {
            id: item.sender_id,
            name: senderObj.full_name,
            avatar_url: senderObj.avatar_url
          };
        });
        
        setFriends(friendsList);
        
        // Create conversations from friends
        if (friendsList.length > 0) {
          // Get the last message for each friend
          const conversationsList = await Promise.all(friendsList.map(async (friend) => {
            try {
              const { data: messagesData } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: false })
                .limit(1);
              
              let lastMessage = "Start a conversation";
              let timestamp = "Just now";
              
              if (messagesData && messagesData.length > 0) {
                lastMessage = messagesData[0].content;
                timestamp = new Date(messagesData[0].created_at).toLocaleTimeString();
              }
              
              return {
                id: friend.id,
                name: friend.name,
                avatar_url: friend.avatar_url,
                lastMessage,
                timestamp,
                unread: messagesData && messagesData.length > 0 ? !messagesData[0].read && messagesData[0].receiver_id === user.id : false,
                user_id: friend.id
              };
            } catch (error) {
              console.error('Error fetching conversation:', error);
              // Return default conversation if error occurs
              return {
                id: friend.id,
                name: friend.name,
                avatar_url: friend.avatar_url,
                lastMessage: "Start a conversation",
                timestamp: "Just now",
                unread: false,
                user_id: friend.id
              };
            }
          }));
          
          setConversations(conversationsList);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFriends();
    
    // Subscribe to friend_requests changes to update the list when new friends are added
    const friendsChannel = supabase
      .channel('public:friend_requests')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'friend_requests' },
        (payload) => {
          if (
            payload.new && 
            (payload.new.sender_id === user.id || payload.new.receiver_id === user.id) &&
            payload.new.status === FriendStatus.ACCEPTED
          ) {
            fetchFriends();
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(friendsChannel);
    };
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !mediaAttachment) return;
    if (!user || !selectedConversation) return;
    
    try {
      setIsSending(true);
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
      
      // Get sender's profile info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();
      
      // Create a new message object
      const messageData = {
        sender_id: user.id,
        receiver_id: selectedConversation,
        content: newMessage || ' ', // Use space if only sending media
        media_url: mediaUrl,
        read: false
      };
      
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select();
        
      if (error) throw error;
      
      // Update local messages
      if (data && data[0]) {
        const newMsg: Message = {
          id: data[0].id,
          sender_id: user.id,
          content: newMessage || ' ',
          timestamp: new Date().toLocaleTimeString(),
          isOutgoing: true,
          media_url: mediaUrl || undefined,
          sender_avatar: profileData?.avatar_url,
          sender_name: profileData?.full_name
        };
        
        setMessages(prev => [...prev, newMsg]);
      }
      
      // Update conversation with latest message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation 
            ? { 
                ...conv, 
                lastMessage: newMessage || 'Sent an attachment', 
                timestamp: new Date().toLocaleTimeString()
              }
            : conv
        )
      );
      
      setNewMessage("");
      setMediaAttachment(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
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
        // First update unread messages as read
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('sender_id', selectedConversation)
          .eq('receiver_id', user.id)
          .eq('read', false);
        
        // Then fetch all messages for the conversation
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(full_name, avatar_url)
          `)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedConversation}),and(sender_id.eq.${selectedConversation},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        setMessages((data || []).map(msg => ({
          id: msg.id,
          sender_id: msg.sender_id,
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString(),
          isOutgoing: msg.sender_id === user.id,
          media_url: msg.media_url,
          sender_avatar: msg.sender?.avatar_url,
          sender_name: msg.sender?.full_name
        })));
        
        // Update conversation unread status
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation 
              ? { ...conv, unread: false }
              : conv
          )
        );
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    
    fetchMessages();
    
    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('messages_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(and(sender_id=eq.${user.id},receiver_id=eq.${selectedConversation}),and(sender_id=eq.${selectedConversation},receiver_id=eq.${user.id}))`
      }, async (payload) => {
        const newMsg = payload.new;
        
        // If the new message is from the conversation partner, mark it as read
        if (newMsg.sender_id === selectedConversation) {
          await supabase
            .from('messages')
            .update({ read: true })
            .eq('id', newMsg.id);
        }
        
        // Fetch sender profile info
        const { data: senderData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', newMsg.sender_id)
          .single();
        
        // Add the new message to the conversation
        setMessages(prev => [...prev, {
          id: newMsg.id,
          sender_id: newMsg.sender_id,
          content: newMsg.content,
          timestamp: new Date(newMsg.created_at).toLocaleTimeString(),
          isOutgoing: newMsg.sender_id === user.id,
          media_url: newMsg.media_url,
          sender_avatar: senderData?.avatar_url,
          sender_name: senderData?.full_name
        }]);
        
        // Update conversation with latest message
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation 
              ? { 
                  ...conv, 
                  lastMessage: newMsg.content || 'Sent an attachment', 
                  timestamp: new Date(newMsg.created_at).toLocaleTimeString(),
                  unread: false
                }
              : conv
          )
        );
      })
      .subscribe();
      
    // Subscribe to unread messages for other conversations
    const unreadMessagesChannel = supabase
      .channel('unread_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `and(receiver_id=eq.${user.id},read=eq.false)`
      }, (payload) => {
        const newMsg = payload.new;
        
        // Don't update if it's for the current conversation
        if (newMsg.sender_id === selectedConversation) return;
        
        // Update the unread status for the sender's conversation
        setConversations(prev => 
          prev.map(conv => 
            conv.id === newMsg.sender_id 
              ? { 
                  ...conv, 
                  lastMessage: newMsg.content || 'Sent an attachment', 
                  timestamp: new Date(newMsg.created_at).toLocaleTimeString(),
                  unread: true
                }
              : conv
          )
        );
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(unreadMessagesChannel);
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
                <Avatar className="w-10 h-10">
                  {conversation.avatar_url ? (
                    <AvatarImage src={conversation.avatar_url} alt={conversation.name} />
                  ) : (
                    <AvatarFallback>
                      <User className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  )}
                </Avatar>
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
          
        if (error && error.code !== 'PGRST116') {
          // PGRST116 is the error code for no rows returned
          throw error;
        }
        
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
                <Avatar className="h-10 w-10">
                  {foundUser.avatar_url ? (
                    <AvatarImage src={foundUser.avatar_url} alt={foundUser.full_name} />
                  ) : (
                    <AvatarFallback>
                      <User className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  )}
                </Avatar>
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
                <ScrollArea 
                  ref={scrollAreaRef} 
                  className="flex-1 p-4"
                >
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isOutgoing ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!message.isOutgoing && (
                          <Avatar className="h-8 w-8 mr-2 self-end mb-4">
                            {message.sender_avatar ? (
                              <AvatarImage src={message.sender_avatar} alt={message.sender_name || ""} />
                            ) : (
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[75%] rounded-lg p-3 ${
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
                        {message.isOutgoing && (
                          <Avatar className="h-8 w-8 ml-2 self-end mb-4">
                            {message.sender_avatar ? (
                              <AvatarImage src={message.sender_avatar} alt={message.sender_name || ""} />
                            ) : (
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex flex-col gap-2">
                    {mediaAttachment && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-accent rounded-full text-sm self-start">
                        <span className="truncate max-w-[100px]">{mediaAttachment.name}</span>
                        <button 
                          type="button" 
                          onClick={() => setMediaAttachment(null)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
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
                      <Button type="submit" disabled={isSending}>
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send message</span>
                      </Button>
                    </div>
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
                    <div className="flex items-center gap-2">
                      {(() => {
                        const conversation = conversations.find((c) => c.id === selectedConversation);
                        return (
                          <>
                            <Avatar className="h-8 w-8">
                              {conversation?.avatar_url ? (
                                <AvatarImage src={conversation.avatar_url} alt={conversation.name} />
                              ) : (
                                <AvatarFallback>
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <h3 className="font-semibold">{conversation?.name}</h3>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <ScrollArea 
                    ref={scrollAreaRef}
                    className="flex-1 p-4"
                  >
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.isOutgoing ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!message.isOutgoing && (
                            <Avatar className="h-8 w-8 mr-2 self-end mb-4">
                              {message.sender_avatar ? (
                                <AvatarImage src={message.sender_avatar} alt={message.sender_name || ""} />
                              ) : (
                                <AvatarFallback>
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                          )}
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
                          {message.isOutgoing && (
                            <Avatar className="h-8 w-8 ml-2 self-end mb-4">
                              {message.sender_avatar ? (
                                <AvatarImage src={message.sender_avatar} alt={message.sender_name || ""} />
                              ) : (
                                <AvatarFallback>
                                  <User className="h-4 w-4" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex flex-col gap-2">
                      {mediaAttachment && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-accent rounded-full text-sm self-start">
                          <span className="truncate max-w-[150px]">{mediaAttachment.name}</span>
                          <button 
                            type="button" 
                            onClick={() => setMediaAttachment(null)}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2">
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
                        <Button type="submit" disabled={isSending}>
                          <Send className="h-4 w-4" />
                          <span className="sr-only">Send message</span>
                        </Button>
                      </div>
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
