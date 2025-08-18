"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  confirmAppointment,
  cancelAppointmentDoc,
  setAvailability,
  updateDoctorProfile,
} from "@/lib/actions/doctor-dashboard";
import type {
  DoctorAppointmentItem,
  AvailabilitySlotRecord,
  SlotInput,
} from "@/lib/actions/doctor-dashboard";
import type { DoctorDetail } from "@/lib/actions/doctors";
import { formatPaise } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Calendar, Clock, User, X, CheckCircle, Save } from "lucide-react";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface DoctorDashboardClientProps {
  todayAppointments: DoctorAppointmentItem[];
  allAppointments: DoctorAppointmentItem[];
  availability: AvailabilitySlotRecord[];
  doctorProfile: DoctorDetail | null;
}

function AppointmentRow({
  appointment,
  onRefresh,
}: {
  appointment: DoctorAppointmentItem;
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmAppointment(appointment.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Appointment confirmed.");
      onRefresh();
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelAppointmentDoc(appointment.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Appointment cancelled.");
      setCancelOpen(false);
      onRefresh();
    });
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <User size={13} className="text-primary" />
            {appointment.patient.name}
          </div>
          <StatusBadge status={appointment.status} />
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {format(new Date(appointment.startsAt), "MMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {format(new Date(appointment.startsAt), "h:mm a")} –{" "}
            {format(new Date(appointment.endsAt), "h:mm a")}
          </span>
        </div>
        {appointment.reason && (
          <p className="mt-1 text-xs text-muted-foreground truncate max-w-xs">
            Reason: {appointment.reason}
          </p>
        )}
      </div>

      {/* Actions */}
      {appointment.status === "PENDING" && (
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={handleConfirm} disabled={isPending}>
            <CheckCircle size={12} />
            Confirm
          </Button>
          <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <DialogTrigger
              render={
                <Button variant="destructive" size="sm" disabled={isPending}>
                  <X size={12} />
                  Cancel
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Appointment</DialogTitle>
                <DialogDescription>
                  Cancel appointment with {appointment.patient.name} on{" "}
                  {format(new Date(appointment.startsAt), "MMMM d 'at' h:mm a")}
                  ?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCancelOpen(false)}
                  disabled={isPending}
                >
                  Keep
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  {isPending ? "Cancelling..." : "Cancel Appointment"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
      {appointment.status === "CONFIRMED" && (
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogTrigger
            render={
              <Button variant="outline" size="sm" disabled={isPending}>
                <X size={12} />
                Cancel
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Appointment</DialogTitle>
              <DialogDescription>
                Cancel confirmed appointment with {appointment.patient.name}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCancelOpen(false)}
                disabled={isPending}
              >
                Keep
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isPending}
              >
                {isPending ? "Cancelling..." : "Yes, Cancel"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function AvailabilityEditor({
  initialSlots,
  onSaved,
}: {
  initialSlots: AvailabilitySlotRecord[];
  onSaved: () => void;
}) {
  const [slots, setSlots] = useState<SlotInput[]>(() => {
    return DAYS_OF_WEEK.flatMap((_, dayOfWeek) => {
      const daySlots = initialSlots.filter((s) => s.dayOfWeek === dayOfWeek);
      return daySlots.length > 0
        ? daySlots
        : [
            {
              dayOfWeek,
              startTime: "09:00",
              endTime: "17:00",
              slotDuration: 30,
            },
          ];
    });
  });

  const [enabledDays, setEnabledDays] = useState<Set<number>>(
    () => new Set(initialSlots.map((s) => s.dayOfWeek))
  );
  const [isSaving, startTransition] = useTransition();

  const updateSlot = (
    dayOfWeek: number,
    field: keyof Omit<SlotInput, "dayOfWeek">,
    value: string | number
  ) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek
          ? {
              ...s,
              [field]:
                field === "slotDuration" ? Number(value) : value,
            }
          : s
      )
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      const toSave = slots.filter((s) => enabledDays.has(s.dayOfWeek));
      const result = await setAvailability(toSave);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Availability saved (${result.data.count} slots).`);
      onSaved();
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day, dayOfWeek) => {
          const slot = slots.find((s) => s.dayOfWeek === dayOfWeek) ?? {
            dayOfWeek,
            startTime: "09:00",
            endTime: "17:00",
            slotDuration: 30,
          };
          const isEnabled = enabledDays.has(dayOfWeek);

          return (
            <div
              key={day}
              className={`rounded-lg border p-4 transition-colors ${
                isEnabled
                  ? "border-border bg-card"
                  : "border-border/50 bg-muted/30"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Switch
                  id={`day-${dayOfWeek}`}
                  checked={isEnabled}
                  onCheckedChange={(checked) => {
                    setEnabledDays((prev) => {
                      const next = new Set(prev);
                      if (checked) next.add(dayOfWeek);
                      else next.delete(dayOfWeek);
                      return next;
                    });
                  }}
                  aria-label={`Enable ${day}`}
                />
                <Label
                  htmlFor={`day-${dayOfWeek}`}
                  className={`font-medium cursor-pointer ${
                    isEnabled ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {day}
                </Label>
              </div>

              {isEnabled && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Start time
                    </Label>
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) =>
                        updateSlot(dayOfWeek, "startTime", e.target.value)
                      }
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      End time
                    </Label>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) =>
                        updateSlot(dayOfWeek, "endTime", e.target.value)
                      }
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Slot duration
                    </Label>
                    <select
                      value={slot.slotDuration}
                      onChange={(e) =>
                        updateSlot(
                          dayOfWeek,
                          "slotDuration",
                          Number(e.target.value)
                        )
                      }
                      className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      aria-label="Slot duration"
                    >
                      <option value={15}>15 min</option>
                      <option value={20}>20 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full h-11">
        <Save size={14} />
        {isSaving ? "Saving..." : "Save Availability"}
      </Button>
    </div>
  );
}

function ProfileEditor({ profile }: { profile: DoctorDetail }) {
  const router = useRouter();
  const [bio, setBio] = useState(profile.bio);
  const [city, setCity] = useState(profile.city);
  const [specialty, setSpecialty] = useState(profile.specialty);
  const [fee, setFee] = useState(String(profile.consultationFee / 100));
  const [experience, setExperience] = useState(
    String(profile.experienceYears)
  );
  const [accepting, setAccepting] = useState(profile.isAcceptingAppointments);
  const [isSaving, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const feeNum = parseFloat(fee);
      const expNum = parseInt(experience, 10);

      if (isNaN(feeNum) || feeNum < 0) {
        toast.error("Please enter a valid consultation fee.");
        return;
      }

      const result = await updateDoctorProfile({
        bio: bio || undefined,
        city: city || undefined,
        specialty: specialty || undefined,
        consultationFee: Math.round(feeNum * 100),
        experienceYears: isNaN(expNum) ? undefined : expNum,
        isAcceptingAppointments: accepting,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Profile updated.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="specialty">Specialty</Label>
          <Input
            id="specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="e.g. Cardiology"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Mumbai"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fee">Consultation Fee (₹)</Label>
          <Input
            id="fee"
            type="number"
            min="0"
            step="50"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            placeholder="500"
          />
          <p className="text-xs text-muted-foreground">
            Current: {formatPaise(profile.consultationFee)}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="experience">Years of Experience</Label>
          <Input
            id="experience"
            type="number"
            min="0"
            max="60"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell patients about your background and expertise..."
          maxLength={1000}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {bio.length}/1000
        </p>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/20">
        <Switch
          id="accepting"
          checked={accepting}
          onCheckedChange={setAccepting}
          aria-label="Accepting new appointments"
        />
        <div>
          <Label htmlFor="accepting" className="font-medium cursor-pointer">
            Accepting new appointments
          </Label>
          <p className="text-xs text-muted-foreground">
            Toggle off to temporarily stop new bookings
          </p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full h-11">
        <Save size={14} />
        {isSaving ? "Saving..." : "Save Profile"}
      </Button>
    </div>
  );
}

export function DoctorDashboardClient({
  todayAppointments,
  allAppointments,
  availability,
  doctorProfile,
}: DoctorDashboardClientProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <Tabs defaultValue="today">
      <TabsList className="mb-6">
        <TabsTrigger value="today">
          Today ({todayAppointments.length})
        </TabsTrigger>
        <TabsTrigger value="all">All Appointments</TabsTrigger>
        <TabsTrigger value="availability">Availability</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
      </TabsList>

      {/* Today */}
      <TabsContent value="today">
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-medium text-foreground">
              {format(new Date(), "EEEE, d MMMM yyyy")}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {todayAppointments.length} appointment
              {todayAppointments.length !== 1 ? "s" : ""} today
            </p>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="py-12 text-center px-4">
              <div className="size-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Calendar size={24} className="text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground mb-1">
                No appointments today
              </p>
              <p className="text-sm text-muted-foreground">Enjoy your day!</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {todayAppointments.map((apt) => (
                <AppointmentRow
                  key={apt.id}
                  appointment={apt}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      {/* All appointments */}
      <TabsContent value="all">
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-medium text-foreground">All Appointments</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {allAppointments.length} total
            </p>
          </div>
          {allAppointments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No appointments yet.</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {allAppointments.map((apt) => (
                <AppointmentRow
                  key={apt.id}
                  appointment={apt}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      {/* Availability */}
      <TabsContent value="availability">
        <div className="rounded-xl border border-border bg-card shadow-sm p-6">
          <div className="mb-5">
            <h2 className="font-medium text-foreground">Weekly Availability</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Set the days and hours when you accept appointments. Changes apply
              to future bookings only.
            </p>
          </div>
          <AvailabilityEditor
            initialSlots={availability}
            onSaved={handleRefresh}
          />
        </div>
      </TabsContent>

      {/* Profile */}
      <TabsContent value="profile">
        <div className="rounded-xl border border-border bg-card shadow-sm p-6">
          <div className="mb-5">
            <h2 className="font-medium text-foreground">Profile Settings</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Update your professional information visible to patients.
            </p>
          </div>
          {doctorProfile ? (
            <ProfileEditor profile={doctorProfile} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Doctor profile not found. Please contact support.
            </p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
