
import React from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MainLayout from '@/components/layout/MainLayout';
import { Search } from 'lucide-react';

const products = [
  {
    id: 1,
    title: "Calculus Textbook",
    price: 45,
    description: "Third Edition, excellent condition",
    category: "Books"
  },
  {
    id: 2,
    title: "Scientific Calculator",
    price: 30,
    description: "TI-84 Plus, barely used",
    category: "Tech"
  },
  // Add more sample products as needed
];

const Marketplace = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Marketplace</h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input 
              placeholder="Search products..." 
              className="pl-10"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle>{product.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{product.description}</p>
                  <p className="text-lg font-bold mt-2">${product.price}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Buy Now</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Marketplace;
