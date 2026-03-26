import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import Landing from "./pages/Landing";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import IntakeChat from "./pages/IntakeChat";
import IntakeResults from "./pages/IntakeResults";
import MatchPage from "./pages/MatchPage";
import ProgressPage from "./pages/ProgressPage";
import TherapistDashboard from "./pages/TherapistDashboard";
import SupervisorPanel from "./pages/SupervisorPanel";
import GuardianPortal from "./pages/GuardianPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/intake" element={<IntakeChat />} />
            <Route path="/results" element={<IntakeResults />} />
            <Route path="/match" element={<MatchPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/therapist" element={<TherapistDashboard />} />
            <Route path="/supervisor" element={<SupervisorPanel />} />
            <Route path="/guardian" element={<GuardianPortal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
