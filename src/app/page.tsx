import Link from "next/link";
import { getDoctors } from "@/lib/actions/doctors";
import { formatPaise } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DoctorAvatar } from "@/components/shared/doctor-avatar";
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Stethoscope,
  Users,
} from "lucide-react";

export default async function LandingPage() {
  const allDoctors = await getDoctors();
  const featuredDoctors = allDoctors.slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section
        className="relative min-h-[88vh] flex items-center"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 20%, oklch(0.54 0.14 196 / 0.06) 0%, transparent 60%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            {/* Left copy — 3/5 */}
            <div className="lg:col-span-3 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="size-2 rounded-full bg-chart-1 animate-pulse" />
                <span className="text-xs font-medium text-primary">
                  500+ doctors available now
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-foreground">
                Healthcare at your
                <span className="text-primary"> fingertips</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Find and book appointments with top-rated doctors near you.
                Secure, fast, and completely online — from your first search to
                confirmed booking in under 2 minutes.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/doctors">
                  <Button size="lg" className="h-11 px-6 text-base">
                    <Search size={18} />
                    Book an Appointment
                  </Button>
                </Link>
                <Link href="/register?role=DOCTOR">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="h-11 px-6 text-base"
                  >
                    <Stethoscope size={18} />
                    For Doctors
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-5 pt-2">
                {[
                  { icon: ShieldCheck, text: "Verified doctors" },
                  { icon: Clock, text: "Instant booking" },
                  { icon: Star, text: "5-star rated" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground"
                  >
                    <Icon size={14} className="text-primary" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right visual — 2/5 */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Mock doctor profile card */}
              <div className="rounded-2xl border border-border bg-card shadow-lg p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                    <Stethoscope size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      Dr. Sarah Johnson
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cardiologist · Mumbai
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-chart-4">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs font-medium">4.9</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-secondary">
                  <Calendar size={14} className="text-primary" />
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      Next Available
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Today · 3:30 PM
                    </p>
                  </div>
                  <Badge className="ml-auto bg-chart-1/15 text-chart-1 border border-chart-1/30 text-xs py-0.5 px-2 rounded-full">
                    Open
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {["9:00 AM", "10:30 AM", "3:30 PM"].map((time) => (
                    <div
                      key={time}
                      className={`text-xs py-2 px-3 rounded-lg border text-center ${
                        time === "3:30 PM"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {time}
                    </div>
                  ))}
                </div>

                <Button className="w-full" size="sm">
                  <CheckCircle size={14} />
                  Confirm Booking
                </Button>
              </div>

              {/* Confirmed appointment pill */}
              <div className="rounded-xl border border-border bg-card shadow-sm p-3 flex items-center gap-3">
                <div className="flex items-center justify-center size-8 rounded-full bg-chart-1/10">
                  <CheckCircle size={14} className="text-chart-1" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Appointment Confirmed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tomorrow · 10:30 AM · Dr. Mehta
                  </p>
                </div>
                <Badge className="ml-auto bg-chart-1/15 text-chart-1 border border-chart-1/30 text-xs py-0.5 px-2 rounded-full">
                  CONFIRMED
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────────────────────── */}
      <section className="bg-card border-y border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: "500+", label: "Verified Doctors" },
              { value: "12", label: "Specialties" },
              { value: "50k+", label: "Appointments Booked" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-semibold text-primary">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">
              Book in 3 simple steps
            </h2>
            <p className="text-muted-foreground mt-2">
              From search to confirmed appointment in under 2 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Search,
                title: "Find Your Doctor",
                description:
                  "Search by specialty, city, or name. Filter by availability, rating, and consultation fee.",
              },
              {
                step: "02",
                icon: Calendar,
                title: "Pick a Time Slot",
                description:
                  "View real-time availability for the next 14 days. Choose a slot that fits your schedule.",
              },
              {
                step: "03",
                icon: CheckCircle,
                title: "Confirm & Pay",
                description:
                  "Book securely and receive instant confirmation. Manage all your appointments from your dashboard.",
              },
            ].map(({ step, icon: Icon, title, description }) => (
              <div
                key={step}
                className="relative rounded-xl border border-border bg-card shadow-sm p-6"
              >
                <div className="absolute -top-3 left-5 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                  {step}
                </div>
                <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 mb-4">
                  <Icon size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Doctors ─────────────────────────────────────────── */}
      {featuredDoctors.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                  Featured Doctors
                </h2>
                <p className="text-muted-foreground mt-1">
                  Top-rated practitioners accepting new patients
                </p>
              </div>
              <Link href="/doctors">
                <Button variant="outline" size="sm">
                  View all
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md p-6 flex flex-col"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <DoctorAvatar
                      name={doctor.name}
                      photoUrl={doctor.photoUrl}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {doctor.name}
                      </h3>
                      <Badge className="mt-1 text-xs bg-primary/10 text-primary border-primary/20">
                        {doctor.specialty}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin size={13} />
                      <span className="truncate">{doctor.city}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-chart-4">
                        <Star size={13} fill="currentColor" />
                        <span className="font-medium text-foreground">
                          {doctor.ratingAvg.toFixed(1)}
                        </span>
                      </div>
                      <span className="font-semibold text-foreground">
                        {formatPaise(doctor.consultationFee)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <Link href={`/doctors/${doctor.id}`}>
                      <Button variant="outline" className="w-full" size="sm">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Specialties Strip ────────────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-foreground tracking-tight text-center mb-8">
            Browse by Specialty
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Cardiology",
              "Dermatology",
              "Neurology",
              "Orthopedics",
              "Pediatrics",
              "General Practice",
              "Psychiatry",
              "Ophthalmology",
              "ENT",
              "Gynecology",
            ].map((specialty) => (
              <Link
                key={specialty}
                href={`/doctors?specialty=${encodeURIComponent(specialty)}`}
              >
                <span className="inline-flex px-4 py-2 rounded-full border border-border bg-card text-sm text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer">
                  {specialty}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────── */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-primary px-8 py-14 text-center">
            <div className="flex items-center justify-center size-14 rounded-2xl bg-white/20 mx-auto mb-5">
              <Users size={28} className="text-white" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">
              Ready to take control of your healthcare?
            </h2>
            <p className="text-white/80 mt-3 mb-8 text-base max-w-xl mx-auto leading-relaxed">
              Join thousands of patients who book appointments online. No
              waiting rooms, no phone calls.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-11 px-6 bg-white text-primary hover:bg-white/90 font-medium"
                >
                  Create Free Account
                </Button>
              </Link>
              <Link href="/doctors">
                <Button
                  variant="ghost"
                  size="lg"
                  className="h-11 px-6 text-white hover:bg-white/10"
                >
                  Browse Doctors
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
