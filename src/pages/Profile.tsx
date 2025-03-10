
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Edit2 } from "lucide-react";
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d" />
              <AvatarFallback>HM</AvatarFallback>
            </Avatar>
            <Button 
              size="icon" 
              variant="secondary" 
              className="absolute bottom-0 right-0 rounded-full"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Hlulani Bliss Mahlathi</h1>
            <p className="text-muted-foreground">Earth Science Student</p>
          </div>
          <Button variant="outline">
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
                  value={user?.email || "hlulani.mahlathi@university.edu"} 
                  readOnly 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="major">Major</Label>
                <Input 
                  id="major" 
                  value="Earth Science - Hydrology and Water Resources" 
                  readOnly 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="year">Year</Label>
                <Input 
                  id="year" 
                  value="First Year" 
                  readOnly 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">About Me</h2>
            <Textarea 
              id="bio"
              value="I'm a first-year Earth Science student at the University of Venda, specializing in Hydrology and Water Resources. I'm passionate about environmental conservation and sustainable water management."
              readOnly 
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {['Hydrology', 'Water Resources', 'Environmental Science', 'Sustainability'].map((interest) => (
                <div 
                  key={interest}
                  className="bg-secondary px-3 py-1 rounded-full text-sm"
                >
                  {interest}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
