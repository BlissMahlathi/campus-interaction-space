
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, ShoppingBag, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  
  const features = [
    {
      icon: BookOpen,
      title: 'Information Hub',
      description: 'Share and access academic resources, join study groups, and stay updated.',
      path: '/hub'
    },
    {
      icon: ShoppingBag,
      title: 'Marketplace',
      description: 'Buy and sell academic materials, tech gadgets, and more within your campus.',
      path: '/marketplace'
    },
    {
      icon: MessageCircle,
      title: 'Messaging',
      description: 'Connect with fellow students, create study groups, and collaborate seamlessly.',
      path: '/messages'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            Welcome to CampusSpace
          </h1>
          <p className="text-lg text-gray-500 px-2 sm:px-0">
            Your all-in-one platform for campus life at University of Venda
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-6">
          {!user ? (
            <>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/signin">Sign In</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          ) : (
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/hub">Explore Platform</Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
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
                <Link to={feature.path} className="inline-flex items-center text-primary">
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
