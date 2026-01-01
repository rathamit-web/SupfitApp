import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from 'next-themes';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Landing from './pages/Landing';
import UserSettings from './pages/UserSettings';
import MyTargets from './pages/MyTargets';
import Plan from './pages/Plan';
import Auth from './pages/Auth';
import CreateProfileStep1 from './pages/CreateProfileStep1';
import CoachHome from './pages/CoachHome';
import ClientDetail from './pages/ClientDetail';
import RevenueTracker from './pages/RevenueTracker';
import Testimonials from './pages/Testimonials';

import SupplementRecommendation from './pages/SupplementRecommendation';
import WorkoutPlan from './pages/WorkoutPlan';
import DietPlan from './pages/DietPlan';
import NotFound from './pages/NotFound';

import FollowersPage from './pages/Followers';
import SelectGym from './pages/SelectGym';
import SelectCoach from './pages/SelectCoach';
import SelectDietician from './pages/SelectDietician';
import Feedback from './pages/Feedback';

const App = () => (
  <ThemeProvider defaultTheme="system" enableSystem>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* <Navbar /> removed for Auth page cleanup */}
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/create-profile" element={<CreateProfileStep1 />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/targets" element={<MyTargets />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/coach-home" element={<CoachHome />} />
          <Route path="/client/:id" element={<ClientDetail />} />
          <Route path="/revenue" element={<RevenueTracker />} />
          <Route path="/followers" element={<FollowersPage />} />
          <Route path="/select-gym" element={<SelectGym />} />
          <Route path="/select-coach" element={<SelectCoach />} />
          <Route path="/select-dietician" element={<SelectDietician />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/supplement-recommendation/:id" element={<SupplementRecommendation />} />
          <Route path="/diet-plan/:id" element={<DietPlan />} />
          <Route path="/workout-plan/:id" element={<WorkoutPlan />} />
          <Route path="/testimonials" element={<Testimonials />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
