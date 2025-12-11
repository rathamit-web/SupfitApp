import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from 'next-themes';
import { toast } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Landing from './pages/Landing';
import UserSettings from './pages/UserSettings';
import MyTargets from './pages/MyTargets';
import Plan from './pages/Plan';
import Auth from './pages/Auth';
import CreateProfile from './pages/CreateProfile';
import CoachHome from './pages/CoachHome';
import ClientDetail from './pages/ClientDetail';
import RevenueTracker from './pages/RevenueTracker';
import NotFound from './pages/NotFound';
import Navbar from '@/components/Navbar';
import FollowersPage from './pages/Followers';
import SelectGym from './pages/SelectGym';
import SelectCoach from './pages/SelectCoach';
import SelectDietician from './pages/SelectDietician';

const App = () => (
  <ThemeProvider defaultTheme="system" enableSystem>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/targets" element={<MyTargets />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/coach" element={<CoachHome />} />
          <Route path="/client/:id" element={<ClientDetail />} />
          <Route path="/revenue" element={<RevenueTracker />} />
          <Route path="/followers" element={<FollowersPage />} />
          <Route path="/select-gym" element={<SelectGym />} />
          <Route path="/select-coach" element={<SelectCoach />} />
          <Route path="/select-dietician" element={<SelectDietician />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
