import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getMyAppointments } from "@/lib/actions/booking";
import { AppointmentStatus } from "@/generated/prisma/enums";
import { DashboardContent } from "./dashboard-content";
import { Calendar, CheckCircle, XCircle } from "lucide-react";

export const metadata = {
  title: "My Dashboard",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  if (user.role === "DOCTOR") {
    redirect("/doctor");
  }

  const result = await getMyAppointments();
  const appointments = result.success ? result.data : [];

  const upcoming = appointments.filter(
    (a) =>
      a.status === AppointmentStatus.CONFIRMED ||
      a.status === AppointmentStatus.PENDING
  );
  const completed = appointments.filter(
    (a) => a.status === AppointmentStatus.COMPLETED
  );
  const cancelled = appointments.filter(
    (a) => a.status === AppointmentStatus.CANCELLED
  );

  const stats = [
    {
      label: "Upcoming",
      value: upcoming.length,
      icon: Calendar,
      colorClass: "text-primary",
      bgClass: "bg-primary/10",
    },
    {
      label: "Completed",
      value: completed.length,
      icon: CheckCircle,
      colorClass: "text-chart-1",
      bgClass: "bg-chart-1/10",
    },
    {
      label: "Cancelled",
      value: cancelled.length,
      icon: XCircle,
      colorClass: "text-muted-foreground",
      bgClass: "bg-muted",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          My Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user.name.split(" ")[0]}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, colorClass, bgClass }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card shadow-sm p-6"
          >
            <div className={`size-10 rounded-lg ${bgClass} flex items-center justify-center mb-3`}>
              <Icon size={20} className={colorClass} />
            </div>
            <p className={`text-3xl font-semibold ${colorClass}`}>{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      <DashboardContent
        upcomingAppointments={upcoming}
        pastAppointments={[...completed, ...cancelled]}
      />
    </div>
  );
}
