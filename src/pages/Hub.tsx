
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Users, Bell, ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MainLayout from '@/components/layout/MainLayout';

const Hub = () => {
  const resources = [
    {
      title: "Introduction to Computer Science",
      type: "Course Notes",
      department: "Computer Science",
      downloads: 234,
    },
    {
      title: "Calculus II Study Guide",
      type: "Study Guide",
      department: "Mathematics",
      downloads: 189,
    },
    {
      title: "Physics Lab Manual",
      type: "Lab Material",
      department: "Physics",
      downloads: 156,
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

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Information Hub</h1>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                className="pl-10" 
                placeholder="Search resources, study groups, or announcements..." 
              />
            </div>
            <Button>
              Upload Resource
            </Button>
          </div>
        </div>

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
                key={resource.title}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold">{resource.title}</h3>
                <p className="text-sm text-muted-foreground">{resource.type}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm">{resource.department}</span>
                  <span className="text-sm text-muted-foreground">{resource.downloads} downloads</span>
                </div>
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
    </MainLayout>
  );
};

export default Hub;
