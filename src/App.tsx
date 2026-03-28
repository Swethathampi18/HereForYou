import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { RoleGuard } from "@/components/RoleGuard";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { TherapistSidebar } from "@/pages/TherapistDashboard";
import Landing from "./pages/Landing";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import IntakeChat from "./pages/IntakeChat";
import IntakeResults from "./pages/IntakeResults";
import MatchPage from "./pages/MatchPage";
import ProgressPage from "./pages/ProgressPage";
import TherapistDashboard from "./pages/TherapistDashboard";
import TherapistPatients from "./pages/TherapistPatients";
import TherapistGroups from "./pages/TherapistGroups";
import TherapistSchedule from "./pages/TherapistSchedule";
import TherapistNotes from "./pages/TherapistNotes";
import TherapistReferrals from "./pages/TherapistReferrals";
import TherapistProfile from "./pages/TherapistProfile";
import TherapistPatientReports from "./pages/TherapistPatientReports";
import SupervisorPanel from "./pages/SupervisorPanel";
import GuardianPortal from "./pages/GuardianPortal";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import ContactPage from "./pages/ContactPage";
import PatientReports from "./pages/PatientReports";
import PatientAppointmentHistory from "./pages/PatientAppointmentHistory";
import GuardianAddPatient from "./pages/guardian/GuardianAddPatient";
import GuardianAssessment from "./pages/guardian/GuardianAssessment";
import GuardianProgress from "./pages/guardian/GuardianProgress";
import GuardianAppointments from "./pages/guardian/GuardianAppointments";
import GuardianAppointmentHistory from "./pages/guardian/GuardianAppointmentHistory";
import GuardianReports from "./pages/guardian/GuardianReports";
import GuardianConsent from "./pages/guardian/GuardianConsent";

const queryClient = new QueryClient();

const PatientSettings = () => (
  <div className="flex min-h-screen bg-background"><DashboardSidebar /><main className="flex-1"><SettingsPage /></main></div>
);
const TherapistSettingsPage = () => (
  <div className="flex min-h-screen bg-background"><TherapistSidebar /><main className="flex-1"><SettingsPage /></main></div>
);
const GuardianSettingsPage = () => {
  const { GuardianSidebar } = require("./pages/GuardianPortal");
  return <div className="flex min-h-screen bg-background"><GuardianSidebar /><main className="flex-1"><SettingsPage /></main></div>;
};

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
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/dashboard" element={<Navigate to="/dashboard/patient" replace />} />

              <Route path="/dashboard/patient" element={<RoleGuard allowedRoles={["patient"]}><Dashboard /></RoleGuard>} />
              <Route path="/dashboard/patient/settings" element={<RoleGuard allowedRoles={["patient"]}><PatientSettings /></RoleGuard>} />
              <Route path="/dashboard/patient/reports" element={<RoleGuard allowedRoles={["patient"]}><PatientReports /></RoleGuard>} />
              <Route path="/dashboard/patient/appointment-history" element={<RoleGuard allowedRoles={["patient"]}><PatientAppointmentHistory /></RoleGuard>} />
              <Route path="/intake" element={<RoleGuard allowedRoles={["patient", "guardian"]}><IntakeChat /></RoleGuard>} />
              <Route path="/results" element={<RoleGuard allowedRoles={["patient", "guardian"]}><IntakeResults /></RoleGuard>} />
              <Route path="/match" element={<RoleGuard allowedRoles={["patient"]}><MatchPage /></RoleGuard>} />
              <Route path="/progress" element={<RoleGuard allowedRoles={["patient"]}><ProgressPage /></RoleGuard>} />
              <Route path="/therapist-profile/:id" element={<RoleGuard allowedRoles={["patient", "guardian"]}><TherapistProfile /></RoleGuard>} />

              <Route path="/dashboard/therapist" element={<RoleGuard allowedRoles={["therapist"]}><TherapistDashboard /></RoleGuard>} />
              <Route path="/dashboard/therapist/patients" element={<RoleGuard allowedRoles={["therapist"]}><TherapistPatients /></RoleGuard>} />
              <Route path="/dashboard/therapist/groups" element={<RoleGuard allowedRoles={["therapist"]}><TherapistGroups /></RoleGuard>} />
              <Route path="/dashboard/therapist/schedule" element={<RoleGuard allowedRoles={["therapist"]}><TherapistSchedule /></RoleGuard>} />
              <Route path="/dashboard/therapist/notes" element={<RoleGuard allowedRoles={["therapist"]}><TherapistNotes /></RoleGuard>} />
              <Route path="/dashboard/therapist/patient-reports" element={<RoleGuard allowedRoles={["therapist"]}><TherapistPatientReports /></RoleGuard>} />
              <Route path="/dashboard/therapist/referrals" element={<RoleGuard allowedRoles={["therapist"]}><TherapistReferrals /></RoleGuard>} />
              <Route path="/dashboard/therapist/settings" element={<RoleGuard allowedRoles={["therapist"]}><TherapistSettingsPage /></RoleGuard>} />

              <Route path="/dashboard/guardian" element={<RoleGuard allowedRoles={["guardian"]}><GuardianPortal /></RoleGuard>}>
                <Route path="add-patient" element={<GuardianAddPatient />} />
                <Route path="assessment" element={<GuardianAssessment />} />
                <Route path="progress" element={<GuardianProgress />} />
                <Route path="appointments" element={<GuardianAppointments />} />
                <Route path="appointment-history" element={<GuardianAppointmentHistory />} />
                <Route path="reports" element={<GuardianReports />} />
                <Route path="consent" element={<GuardianConsent />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              <Route path="/dashboard/supervisor" element={<RoleGuard allowedRoles={["supervisor"]}><SupervisorPanel /></RoleGuard>} />
              <Route path="/dashboard/admin" element={<RoleGuard allowedRoles={["admin"]}><SupervisorPanel /></RoleGuard>} />
              <Route path="/supervisor" element={<RoleGuard allowedRoles={["supervisor", "admin"]}><SupervisorPanel /></RoleGuard>} />
              <Route path="/supervisor/*" element={<RoleGuard allowedRoles={["supervisor", "admin"]}><SupervisorPanel /></RoleGuard>} />

              <Route path="/therapist/notes" element={<Navigate to="/dashboard/therapist/notes" replace />} />
              <Route path="/therapist/claims" element={<Navigate to="/dashboard/therapist" replace />} />
              <Route path="/therapist/settings" element={<Navigate to="/dashboard/therapist/settings" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
