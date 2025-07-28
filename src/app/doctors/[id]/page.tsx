import { notFound } from "next/navigation";
import { getDoctorById } from "@/lib/actions/doctors";
import { getAvailableSlots } from "@/lib/actions/booking";
import { getCurrentUser } from "@/lib/session";
import { formatPaise } from "@/lib/payments";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoctorAvatar } from "@/components/shared/doctor-avatar";
import { BookingPanel } from "./booking-panel";
import {
  MapPin,
  Star,
  Clock,
  Stethoscope,
  GraduationCap,
  Globe,
  Mail,
} from "lucide-react";

interface DoctorDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: DoctorDetailPageProps) {
  const { id } = await params;
  const doctor = await getDoctorById(id);
  if (!doctor) return { title: "Doctor Not Found" };
  return {
    title: `${doctor.name} — ${doctor.specialty}`,
    description: doctor.bio,
  };
}

export default async function DoctorDetailPage({
  params,
}: DoctorDetailPageProps) {
  const { id } = await params;

  const [doctor, user] = await Promise.all([
    getDoctorById(id),
    getCurrentUser(),
  ]);

  if (!doctor) notFound();

  const availableSlots = await getAvailableSlots(id, 14);

  const stars = Math.round(doctor.ratingAvg);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-5 gap-8 items-start">
        {/* ── Left: Doctor Profile ── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Hero row */}
          <div className="rounded-xl border border-border bg-card shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <DoctorAvatar
                name={doctor.name}
                photoUrl={doctor.photoUrl}
                size="lg"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                      {doctor.name}
                    </h1>
                    <Badge className="mt-2 bg-primary/10 text-primary border border-primary/20">
                      {doctor.specialty}
                    </Badge>
                  </div>
                  {doctor.isAcceptingAppointments ? (
                    <Badge className="shrink-0 bg-chart-1/10 text-chart-1 border border-chart-1/20">
                      Accepting Patients
                    </Badge>
                  ) : (
                    <Badge className="shrink-0 bg-muted text-muted-foreground border border-border">
                      Not Accepting
                    </Badge>
                  )}
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={14} className="text-primary shrink-0" />
                    <span>{doctor.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} className="text-primary shrink-0" />
                    <span>{doctor.experienceYears} years experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={
                            i < stars
                              ? "text-chart-4 fill-chart-4"
                              : "text-muted-foreground"
                          }
                        />
                      ))}
                    </div>
                    <span className="font-medium text-foreground">
                      {doctor.ratingAvg.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">/ 5.0</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={14} className="text-primary shrink-0" />
                    <span className="truncate">{doctor.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-xl border border-border bg-card shadow-sm p-6">
            <Tabs defaultValue="about">
              <TabsList className="mb-5">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                {/* Bio */}
                {doctor.bio && (
                  <div>
                    <h2 className="text-base font-medium text-foreground mb-2">
                      About
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {doctor.bio}
                    </p>
                  </div>
                )}

                {/* Details */}
                <div>
                  <h2 className="text-base font-medium text-foreground mb-3">
                    Professional Details
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <GraduationCap size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Experience
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {doctor.experienceYears} years in {doctor.specialty}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Stethoscope size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Specialty
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {doctor.specialty}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Globe size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Location
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {doctor.city}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust indicators */}
                <div className="p-4 rounded-lg bg-secondary/30 border border-secondary">
                  <p className="text-xs font-medium text-secondary-foreground mb-2">
                    Why patients trust this doctor
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { label: "Rating", value: `${doctor.ratingAvg.toFixed(1)}/5.0` },
                      { label: "Experience", value: `${doctor.experienceYears} yrs` },
                      { label: "Fee", value: formatPaise(doctor.consultationFee) },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <p className="text-sm font-semibold text-foreground">
                          {value}
                        </p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="availability">
                <div>
                  <h2 className="text-base font-medium text-foreground mb-3">
                    Weekly Schedule
                  </h2>
                  {doctor.availabilitySlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No availability schedule set up yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {[
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                      ].map((day, i) => {
                        const slots = doctor.availabilitySlots.filter(
                          (s) => s.dayOfWeek === i
                        );
                        return (
                          <div
                            key={day}
                            className="flex items-center justify-between py-2 border-b border-border last:border-0"
                          >
                            <span className="text-sm font-medium text-foreground w-24">
                              {day}
                            </span>
                            {slots.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {slots.map((slot) => (
                                  <span
                                    key={slot.id}
                                    className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
                                  >
                                    {slot.startTime} – {slot.endTime}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Not available
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* ── Right: Booking Card ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <BookingPanel
              doctorProfileId={id}
              doctorName={doctor.name}
              consultationFee={doctor.consultationFee}
              availableSlots={availableSlots}
              isAcceptingAppointments={doctor.isAcceptingAppointments}
              isLoggedIn={!!user}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
