
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, ShoppingBag, MessageCircle } from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Information Hub',
      description: 'Share and access academic resources, join study groups, and stay updated.'
    },
    {
      icon: ShoppingBag,
      title: 'Marketplace',
      description: 'Buy and sell academic materials, tech gadgets, and more within your campus.'
    },
    {
      icon: MessageCircle,
      title: 'Messaging',
      description: 'Connect with fellow students, create study groups, and collaborate seamlessly.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Welcome to CampusSpace
          </h1>
          <p className="text-xl text-gray-500">
            Your all-in-one platform for campus life
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/signup">Sign Up</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 pt-12">
          {features.map((feature) => (
            <div key={feature.title} className="group relative bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-primary text-white p-2 rounded-lg">
                  <feature.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="pt-4">
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-gray-500">{feature.description}</p>
              </div>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link to={`/${feature.title.toLowerCase().replace(' ', '')}`} className="inline-flex items-center text-primary">
                  Learn more <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
