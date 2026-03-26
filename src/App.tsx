import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/RoleGuard";
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
        <AuthProvider>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SignIn />} />

              {/* Legacy redirect */}
              <Route path="/dashboard" element={<Navigate to="/dashboard/patient" replace />} />

              {/* Role-protected routes */}
              <Route path="/dashboard/patient" element={<RoleGuard allowedRoles={["patient"]}><Dashboard /></RoleGuard>} />
              <Route path="/dashboard/therapist" element={<RoleGuard allowedRoles={["therapist"]}><TherapistDashboard /></RoleGuard>} />
              <Route path="/dashboard/guardian" element={<RoleGuard allowedRoles={["guardian"]}><GuardianPortal /></RoleGuard>} />
              <Route path="/dashboard/supervisor" element={<RoleGuard allowedRoles={["supervisor"]}><SupervisorPanel /></RoleGuard>} />
              <Route path="/dashboard/admin" element={<RoleGuard allowedRoles={["admin"]}><SupervisorPanel /></RoleGuard>} />

              {/* Patient routes */}
              <Route path="/intake" element={<RoleGuard allowedRoles={["patient", "guardian"]}><IntakeChat /></RoleGuard>} />
              <Route path="/results" element={<RoleGuard allowedRoles={["patient", "guardian"]}><IntakeResults /></RoleGuard>} />
              <Route path="/match" element={<RoleGuard allowedRoles={["patient"]}><MatchPage /></RoleGuard>} />
              <Route path="/progress" element={<RoleGuard allowedRoles={["patient"]}><ProgressPage /></RoleGuard>} />

              {/* Therapist sub-routes */}
              <Route path="/therapist/notes" element={<RoleGuard allowedRoles={["therapist"]}><TherapistDashboard /></RoleGuard>} />
              <Route path="/therapist/claims" element={<RoleGuard allowedRoles={["therapist"]}><TherapistDashboard /></RoleGuard>} />

              {/* Supervisor sub-routes */}
              <Route path="/supervisor" element={<RoleGuard allowedRoles={["supervisor", "admin"]}><SupervisorPanel /></RoleGuard>} />
              <Route path="/supervisor/*" element={<RoleGuard allowedRoles={["supervisor", "admin"]}><SupervisorPanel /></RoleGuard>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
