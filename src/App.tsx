
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";

// Pages
import Index from '@/pages/Index';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import Hub from '@/pages/Hub';
import Profile from '@/pages/Profile';
import Messages from '@/pages/Messages';
import StudyGroups from '@/pages/StudyGroups';
import Marketplace from '@/pages/Marketplace';
import Announcements from '@/pages/Announcements';
import NotFound from '@/pages/NotFound';
import Admin from '@/pages/Admin';

// Providers
import { AuthProvider } from '@/contexts/AuthContext';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/hub" element={<Hub />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/study-groups" element={<StudyGroups />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
