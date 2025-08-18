import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import {
  getDoctorAppointments,
  getDoctorDashboardStats,
  getMyAvailability,
  getMyDoctorDetail,
} from "@/lib/actions/doctor-dashboard";
import { DoctorDashboardClient } from "./doctor-dashboard-client";
import { Calendar, CheckCircle, Clock, BarChart3 } from "lucide-react";

export const metadata = {
  title: "Doctor Dashboard",
};

export default async function DoctorPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/doctor");
  }

  if (user.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  const [appointmentsResult, statsResult, availabilityResult, doctorDetailResult] =
    await Promise.all([
      getDoctorAppointments(),
      getDoctorDashboardStats(),
      getMyAvailability(),
      getMyDoctorDetail(),
    ]);

  const appointments = appointmentsResult.success
    ? appointmentsResult.data
    : [];
  const stats = statsResult.success
    ? statsResult.data
    : { todayCount: 0, pendingCount: 0, confirmedCount: 0, totalCount: 0 };
  const availability = availabilityResult.success
    ? availabilityResult.data
    : [];
  const doctorDetail = doctorDetailResult.success ? doctorDetailResult.data : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = appointments.filter((a) => {
    const d = new Date(a.startsAt);
    return d >= today && d < tomorrow;
  });

  const statCards = [
    {
      label: "Today's Appointments",
      value: stats.todayCount,
      icon: Calendar,
      colorClass: "text-primary",
      bgClass: "bg-primary/10",
    },
    {
      label: "Pending Confirmation",
      value: stats.pendingCount,
      icon: Clock,
      colorClass: "text-chart-4",
      bgClass: "bg-chart-4/10",
    },
    {
      label: "Confirmed",
      value: stats.confirmedCount,
      icon: CheckCircle,
      colorClass: "text-chart-1",
      bgClass: "bg-chart-1/10",
    },
    {
      label: "Total Appointments",
      value: stats.totalCount,
      icon: BarChart3,
      colorClass: "text-muted-foreground",
      bgClass: "bg-muted",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Doctor Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user.name.split(" ")[0]}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, colorClass, bgClass }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card shadow-sm p-5"
          >
            <div
              className={`size-9 rounded-lg ${bgClass} flex items-center justify-center mb-3`}
            >
              <Icon size={18} className={colorClass} />
            </div>
            <p className={`text-3xl font-semibold ${colorClass}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      <DoctorDashboardClient
        todayAppointments={todayAppointments}
        allAppointments={appointments}
        availability={availability}
        doctorProfile={doctorDetail}
      />
    </div>
  );
}
