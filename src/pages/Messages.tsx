
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import MainLayout from '@/components/layout/MainLayout';
import { MessageCircle, Send, User, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  isOutgoing: boolean;
}

interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

const conversations: Conversation[] = [
  {
    id: 1,
    name: "John Doe",
    lastMessage: "Hey, are you interested in buying the textbook?",
    timestamp: "10:30 AM",
    unread: true,
  },
  {
    id: 2,
    name: "Jane Smith",
    lastMessage: "Thanks for the notes!",
    timestamp: "Yesterday",
    unread: false,
  },
];

const sampleMessages: Message[] = [
  {
    id: 1,
    sender: "John Doe",
    content: "Hey, are you interested in buying the textbook?",
    timestamp: "10:30 AM",
    isOutgoing: false,
  },
  {
    id: 2,
    sender: "You",
    content: "Yes, I am! What's the condition of the book?",
    timestamp: "10:32 AM",
    isOutgoing: true,
  },
];

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1);
  const [newMessage, setNewMessage] = useState("");
  const isMobile = useIsMobile();

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    // Here you would typically send the message to your backend
    console.log("Sending message:", newMessage);
    setNewMessage("");
  };

  const ConversationsList = () => (
    <div className="w-full h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
        </h2>
      </div>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        {conversations.map((conversation) => (
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
        ))}
      </ScrollArea>
    </div>
  );

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
                </SheetContent>
              </Sheet>
            </div>
            
            {selectedConversation ? (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {sampleMessages.map((message) => (
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
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <Button type="submit">
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send message</span>
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop view with side-by-side layout */}
            <div className="w-80 border-r bg-white">
              <ConversationsList />
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
                      {sampleMessages.map((message) => (
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
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1"
                      />
                      <Button type="submit">
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send message</span>
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a conversation to start messaging
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
