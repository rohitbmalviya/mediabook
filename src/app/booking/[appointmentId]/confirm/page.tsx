import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getAppointmentById } from "@/lib/actions/booking";
import { formatPaise } from "@/lib/payments";
import { format } from "date-fns";
import { PayButton } from "./pay-button";
import { Badge } from "@/components/ui/badge";
import { DoctorAvatar } from "@/components/shared/doctor-avatar";
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export const metadata = {
  title: "Confirm & Pay",
};

interface ConfirmPageProps {
  params: Promise<{ appointmentId: string }>;
}

export default async function ConfirmPage({ params }: ConfirmPageProps) {
  const { appointmentId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/booking/${appointmentId}/confirm`);
  }

  const result = await getAppointmentById(appointmentId);
  if (!result.success) {
    notFound();
  }

  const appointment = result.data;

  // If already confirmed, go to dashboard
  if (appointment.status === "CONFIRMED") {
    redirect("/dashboard?confirmed=1");
  }

  if (appointment.status === "CANCELLED") {
    redirect("/dashboard");
  }

  const doctor = appointment.doctor;
  const profile = doctor.doctorProfile;
  const fee = appointment.payment?.amount ?? profile?.consultationFee ?? 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {/* Demo notice */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-chart-4/10 border border-chart-4/30 mb-6">
        <AlertTriangle size={15} className="text-chart-4 shrink-0 mt-0.5" />
        <p className="text-xs text-foreground">
          <span className="font-medium">Demo Mode:</span> This is a simulated
          payment. No real money will be charged. Click the button to confirm
          your appointment instantly.
        </p>
      </div>

      {/* Order summary card */}
      <div className="rounded-2xl border border-border bg-card shadow-md p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Confirm Your Appointment
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review the details below before confirming
          </p>
        </div>

        {/* Doctor info */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
          <DoctorAvatar
            name={doctor.name}
            photoUrl={profile?.photoUrl ?? ""}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">{doctor.name}</p>
            {profile && (
              <>
                <Badge className="mt-1 text-xs bg-primary/10 text-primary border-primary/20">
                  {profile.specialty}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin size={10} />
                  {profile.city}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Appointment details */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Appointment Details
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar size={13} className="text-primary" />
              </div>
              <div>
                <span className="text-muted-foreground">Date: </span>
                <span className="text-foreground font-medium">
                  {format(new Date(appointment.startsAt), "EEEE, MMMM d, yyyy")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock size={13} className="text-primary" />
              </div>
              <div>
                <span className="text-muted-foreground">Time: </span>
                <span className="text-foreground font-medium">
                  {format(new Date(appointment.startsAt), "h:mm a")} –{" "}
                  {format(new Date(appointment.endsAt), "h:mm a")}
                </span>
              </div>
            </div>
            {appointment.reason && (
              <div className="flex items-start gap-3 text-sm">
                <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck size={13} className="text-primary" />
                </div>
                <div>
                  <span className="text-muted-foreground">Reason: </span>
                  <span className="text-foreground">{appointment.reason}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Divider + fee */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Consultation fee
            </span>
            <span className="text-2xl font-semibold text-foreground">
              {formatPaise(fee)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            One-time payment for the consultation
          </p>
        </div>

        {/* Pay button */}
        <PayButton
          appointmentId={appointmentId}
          fee={formatPaise(fee)}
        />

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-6 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck size={13} className="text-chart-1" />
            Secure
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={13} className="text-primary" />
            Instant confirm
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar size={13} className="text-primary" />
            Easy reschedule
          </div>
        </div>
      </div>
    </div>
  );
}
