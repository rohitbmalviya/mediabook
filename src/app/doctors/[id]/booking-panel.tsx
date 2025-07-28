"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, isSameDay } from "date-fns";
import { toast } from "sonner";
import { createAppointment } from "@/lib/actions/booking";
import type { BookableSlot } from "@/lib/actions/booking";
import { formatPaise } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Clock, ShieldCheck, Star } from "lucide-react";

interface BookingPanelProps {
  doctorProfileId: string;
  doctorName: string;
  consultationFee: number;
  availableSlots: BookableSlot[];
  isAcceptingAppointments: boolean;
  isLoggedIn: boolean;
}

export function BookingPanel({
  doctorProfileId,
  doctorName,
  consultationFee,
  availableSlots,
  isAcceptingAppointments,
  isLoggedIn,
}: BookingPanelProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  const [reason, setReason] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map = new Map<string, BookableSlot[]>();
    for (const slot of availableSlots) {
      const dateKey = format(parseISO(slot.startsAt), "yyyy-MM-dd");
      const existing = map.get(dateKey) ?? [];
      map.set(dateKey, [...existing, slot]);
    }
    return map;
  }, [availableSlots]);

  // Dates that have slots
  const availableDates = useMemo(
    () =>
      Array.from(slotsByDate.keys()).map((d) => {
        const [y, m, day] = d.split("-").map(Number);
        return new Date(y, m - 1, day);
      }),
    [slotsByDate]
  );

  // Slots for selected date
  const slotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return slotsByDate.get(key) ?? [];
  }, [selectedDate, slotsByDate]);

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      setSelectedDate(date);
      setSelectedSlot(null);
    },
    []
  );

  const handleBook = async () => {
    if (!selectedSlot) return;

    if (!isLoggedIn) {
      router.push(
        `/login?next=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    setIsBooking(true);
    try {
      const result = await createAppointment({
        doctorProfileId,
        startsAt: selectedSlot.startsAt,
        reason: reason.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Appointment created! Proceed to payment.");
      router.push(`/booking/${result.data.appointmentId}/confirm`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-md p-6 space-y-5">
      {/* Fee */}
      <div className="pb-4 border-b border-border">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold text-foreground">
            {formatPaise(consultationFee)}
          </span>
          <span className="text-sm text-muted-foreground">/consultation</span>
        </div>
      </div>

      {!isAcceptingAppointments ? (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            This doctor is not currently accepting new appointments.
          </p>
        </div>
      ) : (
        <>
          {/* Date Picker */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-primary" />
              Select Date
            </Label>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  const d = new Date(date);
                  d.setHours(0, 0, 0, 0);
                  if (d < today) return true;
                  return !availableDates.some((ad) => isSameDay(ad, d));
                }}
                modifiers={{
                  available: availableDates,
                }}
                modifiersClassNames={{
                  available: "!font-medium",
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                <Clock size={14} className="text-primary" />
                {format(selectedDate, "EEEE, MMMM d")}
              </Label>
              {slotsForDate.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No available slots for this date.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slotsForDate.map((slot) => {
                    const isSelected = selectedSlot?.startsAt === slot.startsAt;
                    return (
                      <button
                        key={slot.startsAt}
                        onClick={() =>
                          setSelectedSlot(isSelected ? null : slot)
                        }
                        className={`text-xs py-2 px-1 rounded-md border text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-foreground hover:border-primary hover:text-primary hover:bg-primary/5"
                        }`}
                        aria-pressed={isSelected}
                        aria-label={`Select time slot ${format(parseISO(slot.startsAt), "h:mm a")}`}
                      >
                        {format(parseISO(slot.startsAt), "h:mm a")}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <Label
              htmlFor="reason"
              className="text-sm font-medium text-foreground mb-1.5 block"
            >
              Reason for visit{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Briefly describe your symptoms or reason for the appointment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              className="resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {reason.length}/500
            </p>
          </div>

          {/* Book Button */}
          <Button
            className="w-full h-11 text-base"
            onClick={handleBook}
            disabled={!selectedSlot || isBooking}
          >
            {isBooking
              ? "Booking..."
              : !isLoggedIn
              ? "Log in to Book"
              : !selectedSlot
              ? "Select a Time Slot"
              : `Book Appointment`}
          </Button>

          {selectedSlot && (
            <p className="text-xs text-center text-muted-foreground">
              Selected:{" "}
              <span className="font-medium text-foreground">
                {format(parseISO(selectedSlot.startsAt), "EEEE, MMM d · h:mm a")}
              </span>
            </p>
          )}

          {/* Trust row */}
          <div className="pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
            {[
              { icon: ShieldCheck, label: "Secure payment" },
              { icon: Clock, label: "Instant confirm" },
              { icon: Star, label: "Trusted doctors" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon size={14} className="text-primary" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
