
import React from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MainLayout from '@/components/layout/MainLayout';
import { Search, ShoppingBag, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Marketplace = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 px-4">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Marketplace</h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input 
                placeholder="Search products..." 
                className="pl-10 w-full"
              />
            </div>
            {user && (
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                List Item
              </Button>
            )}
          </div>
          
          <div className="bg-card p-8 md:p-12 rounded-lg border mt-4 text-center">
            <div className="inline-block p-6 bg-secondary rounded-full mb-4">
              <ShoppingBag className="h-10 w-10 md:h-12 md:w-12 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold mb-2">Campus Marketplace</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Our marketplace will allow you to buy and sell textbooks, study materials, 
              and other items directly with fellow students.
            </p>
            <Button variant="outline">Be notified when it launches</Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Marketplace;
