import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

type UserRole = "patient" | "guardian" | "therapist" | "supervisor" | "admin";

const roleRouteMap: Record<UserRole, string> = {
  patient: "/dashboard/patient",
  guardian: "/dashboard/guardian",
  therapist: "/dashboard/therapist",
  supervisor: "/dashboard/supervisor",
  admin: "/dashboard/admin",
};

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!role || !allowedRoles.includes(role as UserRole)) {
    const redirectTo = role ? roleRouteMap[role as UserRole] || "/" : "/";
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export const getRoleRedirect = (role: string | null): string => {
  if (!role) return "/signin";
  return roleRouteMap[role as UserRole] || "/dashboard/patient";
};
