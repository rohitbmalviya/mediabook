"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { cancelAppointment } from "@/lib/actions/booking";
import type { AppointmentWithDetails } from "@/lib/actions/booking";
import { formatPaise } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { DoctorAvatar } from "@/components/shared/doctor-avatar";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Search,
  MapPin,
} from "lucide-react";

interface DashboardContentProps {
  upcomingAppointments: AppointmentWithDetails[];
  pastAppointments: AppointmentWithDetails[];
}

function CancelDialog({
  appointmentId,
  doctorName,
  date,
  onCancel,
}: {
  appointmentId: string;
  doctorName: string;
  date: Date;
  onCancel: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelAppointment(appointmentId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Appointment cancelled.");
      setOpen(false);
      onCancel();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            Cancel
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Appointment</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel your appointment with{" "}
            <span className="font-medium text-foreground">{doctorName}</span> on{" "}
            <span className="font-medium text-foreground">
              {format(date, "EEEE, MMMM d 'at' h:mm a")}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Keep appointment
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? "Cancelling..." : "Yes, cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AppointmentRow({
  appointment,
  onRefresh,
}: {
  appointment: AppointmentWithDetails;
  onRefresh: () => void;
}) {
  const doctor = appointment.doctor;
  const profile = doctor.doctorProfile;
  const canCancel =
    appointment.status === "PENDING" || appointment.status === "CONFIRMED";

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <DoctorAvatar
            name={doctor.name}
            photoUrl={profile?.photoUrl ?? ""}
            size="sm"
          />
          <div>
            <p className="font-medium text-sm text-foreground">{doctor.name}</p>
            {profile && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin size={10} />
                {profile.city}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {profile?.specialty ?? "—"}
        </span>
      </TableCell>
      <TableCell>
        <div>
          <p className="text-sm text-foreground">
            {format(new Date(appointment.startsAt), "MMM d, yyyy")}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(appointment.startsAt), "h:mm a")} –{" "}
            {format(new Date(appointment.endsAt), "h:mm a")}
          </p>
        </div>
      </TableCell>
      <TableCell>
        {profile && (
          <span className="text-sm font-medium text-foreground">
            {formatPaise(profile.consultationFee)}
          </span>
        )}
      </TableCell>
      <TableCell>
        <StatusBadge status={appointment.status} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {canCancel && (
            <CancelDialog
              appointmentId={appointment.id}
              doctorName={doctor.name}
              date={new Date(appointment.startsAt)}
              onCancel={onRefresh}
            />
          )}
          {profile && (
            <Link href={`/doctors/${profile.id}`}>
              <Button variant="ghost" size="sm">
                <ChevronRight size={14} />
                View
              </Button>
            </Link>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function DashboardContent({
  upcomingAppointments,
  pastAppointments,
}: DashboardContentProps) {
  const router = useRouter();
  const [showPast, setShowPast] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Upcoming */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-medium text-foreground">Upcoming Appointments</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {upcomingAppointments.length} total
          </span>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="size-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">
              No upcoming appointments
            </h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
              Book your first appointment with a doctor to get started.
            </p>
            <Link href="/doctors">
              <Button className="h-11 px-6">
                <Search size={14} />
                Find a Doctor
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingAppointments.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  onRefresh={handleRefresh}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Past appointments — collapsible */}
      {pastAppointments.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <button
            onClick={() => setShowPast((v) => !v)}
            className="w-full p-5 border-b border-border flex items-center justify-between hover:bg-muted/30 transition-colors"
            aria-expanded={showPast}
          >
            <h2 className="font-medium text-foreground">Past Appointments</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {pastAppointments.length} total
              </span>
              {showPast ? (
                <ChevronDown size={16} className="text-muted-foreground" />
              ) : (
                <ChevronRight size={16} className="text-muted-foreground" />
              )}
            </div>
          </button>

          {showPast && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastAppointments.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    onRefresh={handleRefresh}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
