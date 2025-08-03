'use server'
// ============================================================
// MediBook — Booking engine (patient-facing actions)
//
// getAvailableSlots  — compute concrete bookable datetimes
// createAppointment  — book a slot (+ create pending payment)
// confirmMockPayment — mock payment success → CONFIRMED
// cancelAppointment  — patient or doctor can cancel
// getMyAppointments  — patient's own appointments
// ============================================================

import { z } from 'zod'
import { addDays, startOfDay, format, parseISO, isBefore } from 'date-fns'
import { db } from '@/lib/db'
import { requireUser, requireRole } from '@/lib/session'
import { mockProcessPayment } from '@/lib/payments'
import { AppointmentStatus, PaymentStatus, Role } from '@/generated/prisma/enums'

// ─── Return types ─────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export type BookableSlot = {
  startsAt: string  // ISO 8601
  endsAt: string    // ISO 8601
}

export type AppointmentWithDetails = {
  id: string
  startsAt: Date
  endsAt: Date
  status: AppointmentStatus
  reason: string | null
  notes: string | null
  createdAt: Date
  doctor: {
    id: string          // User.id
    name: string
    email: string
    doctorProfile: {
      id: string        // DoctorProfile.id
      specialty: string
      photoUrl: string
      consultationFee: number
      city: string
    } | null
  }
  patient: {
    id: string
    name: string
    email: string
  }
  payment: {
    id: string
    status: PaymentStatus
    amount: number
    transactionId: string | null
  } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parses "HH:MM" into { hours, minutes }. */
function parseHHMM(t: string): { hours: number; minutes: number } {
  const [h, m] = t.split(':').map(Number)
  return { hours: h, minutes: m }
}

/** Builds a Date for a given date + "HH:MM" time string (local time). */
function buildDateTime(date: Date, timeStr: string): Date {
  const { hours, minutes } = parseHHMM(timeStr)
  const d = new Date(date)
  d.setHours(hours, minutes, 0, 0)
  return d
}

// ─── getAvailableSlots ────────────────────────────────────────────────────────

/**
 * Computes concrete bookable slot datetimes for the next N days.
 *
 * Algorithm:
 * 1. Load weekly AvailabilitySlots for the doctor profile.
 * 2. For each day in [today, today+days), expand slots from startTime to
 *    endTime in slotDuration-minute increments.
 * 3. Subtract PENDING|CONFIRMED appointments that fall in that window.
 * 4. Remove slots that have already started.
 */
export async function getAvailableSlots(
  doctorProfileId: string,
  days = 14
): Promise<BookableSlot[]> {
  const profile = await db.doctorProfile.findUnique({
    where: { id: doctorProfileId },
    include: { availabilitySlots: true },
  })

  if (!profile || !profile.isAcceptingAppointments) return []

  const now = new Date()
  const rangeStart = startOfDay(now)
  const rangeEnd = addDays(rangeStart, days)

  // Fetch existing appointments in range (using User.id = profile.userId)
  const existingAppointments = await db.appointment.findMany({
    where: {
      doctorId: profile.userId,
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      startsAt: { gte: rangeStart, lt: rangeEnd },
    },
    select: { startsAt: true },
  })

  const bookedTimes = new Set(
    existingAppointments.map((a) => a.startsAt.toISOString())
  )

  const slots: BookableSlot[] = []

  // Walk through each day
  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const currentDay = addDays(rangeStart, dayOffset)
    const dayOfWeek = currentDay.getDay() // 0=Sunday … 6=Saturday

    const templateSlots = profile.availabilitySlots.filter(
      (s) => s.dayOfWeek === dayOfWeek
    )

    for (const template of templateSlots) {
      const windowStart = buildDateTime(currentDay, template.startTime)
      const windowEnd = buildDateTime(currentDay, template.endTime)
      const durationMs = template.slotDuration * 60 * 1000

      let cursor = windowStart
      while (cursor < windowEnd) {
        const slotEnd = new Date(cursor.getTime() + durationMs)

        // Skip if slot end exceeds window or slot already started
        if (slotEnd > windowEnd) break
        if (!isBefore(now, cursor)) {
          cursor = slotEnd
          continue
        }

        if (!bookedTimes.has(cursor.toISOString())) {
          slots.push({
            startsAt: cursor.toISOString(),
            endsAt: slotEnd.toISOString(),
          })
        }

        cursor = slotEnd
      }
    }
  }

  // Sort chronologically
  slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  return slots
}

// ─── createAppointment ────────────────────────────────────────────────────────

const CreateAppointmentSchema = z.object({
  doctorProfileId: z.string().min(1),
  startsAt: z.string().datetime(),
  reason: z.string().max(500).optional(),
})

export type CreateAppointmentInput = {
  doctorProfileId: string
  startsAt: string   // ISO 8601
  reason?: string
}

export type CreateAppointmentResult = ActionResult<{
  appointmentId: string
  paymentId: string
}>

/**
 * Books a slot.
 * Re-validates the slot is still open (double-booking guard at application level).
 * DB-level guard (@@unique) also prevents concurrent double-booking.
 *
 * Requires: authenticated PATIENT.
 */
export async function createAppointment(
  input: CreateAppointmentInput
): Promise<CreateAppointmentResult> {
  const patient = await requireUser()

  const parsed = CreateAppointmentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }

  const { doctorProfileId, startsAt: startsAtStr, reason } = parsed.data
  const startsAt = parseISO(startsAtStr)

  // Require slot to be in the future
  if (!isBefore(new Date(), startsAt)) {
    return { success: false, error: 'This slot is in the past' }
  }

  // Resolve DoctorProfile → get fee and doctorUserId
  const profile = await db.doctorProfile.findUnique({
    where: { id: doctorProfileId },
    include: {
      availabilitySlots: true,
    },
  })

  if (!profile || !profile.isAcceptingAppointments) {
    return { success: false, error: 'Doctor not found or not accepting appointments' }
  }

  // Derive endsAt from matching availability slot
  const dayOfWeek = startsAt.getDay()
  const timeStr = format(startsAt, 'HH:mm')

  const matchingTemplate = profile.availabilitySlots.find((s) => {
    if (s.dayOfWeek !== dayOfWeek) return false
    // Check the slot start falls within the template window
    const windowStart = buildDateTime(startsAt, s.startTime)
    const windowEnd = buildDateTime(startsAt, s.endTime)
    const slotStart = buildDateTime(startsAt, timeStr)
    return slotStart >= windowStart && slotStart < windowEnd
  })

  const slotDurationMinutes = matchingTemplate?.slotDuration ?? 30
  const endsAt = new Date(startsAt.getTime() + slotDurationMinutes * 60 * 1000)

  // CRITICAL: AvailabilitySlot.doctorId = DoctorProfile.id
  //           Appointment.doctorId = User.id (profile.userId)
  const doctorUserId = profile.userId

  // Application-level double-booking re-check
  const conflict = await db.appointment.findUnique({
    where: {
      doctorId_startsAt: {
        doctorId: doctorUserId,
        startsAt,
      },
    },
  })

  if (conflict) {
    return {
      success: false,
      error: 'This slot was just taken. Please choose another time.',
    }
  }

  try {
    // Create appointment + payment atomically
    const result = await db.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctorUserId,
          startsAt,
          endsAt,
          status: AppointmentStatus.PENDING,
          reason: reason ?? null,
        },
      })

      const payment = await tx.payment.create({
        data: {
          appointmentId: appointment.id,
          amount: profile.consultationFee,
          status: PaymentStatus.PENDING,
          provider: 'mock',
        },
      })

      return { appointment, payment }
    })

    return {
      success: true,
      data: {
        appointmentId: result.appointment.id,
        paymentId: result.payment.id,
      },
    }
  } catch (err: unknown) {
    // Prisma unique constraint violation → double-book race
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return {
        success: false,
        error: 'This slot was just taken. Please choose another time.',
      }
    }
    console.error('[createAppointment]', err)
    return { success: false, error: 'Failed to book appointment. Please try again.' }
  }
}

// ─── confirmMockPayment ───────────────────────────────────────────────────────

export type ConfirmPaymentResult = ActionResult<{
  appointmentId: string
  transactionId: string
}>

/**
 * Simulates a successful payment.
 * Marks Payment → PAID, Appointment → CONFIRMED.
 *
 * Requires: authenticated user who is the patient for this appointment.
 */
export async function confirmMockPayment(
  appointmentId: string
): Promise<ConfirmPaymentResult> {
  const user = await requireUser()

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: { payment: true },
  })

  if (!appointment) {
    return { success: false, error: 'Appointment not found' }
  }

  if (appointment.patientId !== user.id) {
    return { success: false, error: 'Forbidden' }
  }

  if (appointment.status !== AppointmentStatus.PENDING) {
    return {
      success: false,
      error: `Appointment is already ${appointment.status.toLowerCase()}`,
    }
  }

  if (!appointment.payment) {
    return { success: false, error: 'Payment record not found' }
  }

  // Call through the payment seam
  const paymentResult = await mockProcessPayment({
    appointmentId,
    amountPaise: appointment.payment.amount,
  })

  if (!paymentResult.success) {
    return { success: false, error: paymentResult.error }
  }

  await db.$transaction([
    db.payment.update({
      where: { id: appointment.payment.id },
      data: {
        status: PaymentStatus.PAID,
        transactionId: paymentResult.transactionId,
      },
    }),
    db.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CONFIRMED },
    }),
  ])

  return {
    success: true,
    data: {
      appointmentId,
      transactionId: paymentResult.transactionId,
    },
  }
}

// ─── cancelAppointment ────────────────────────────────────────────────────────

export type CancelResult = ActionResult<{ appointmentId: string }>

/**
 * Cancels an appointment.
 * Authorized for: the patient who booked OR the doctor.
 */
export async function cancelAppointment(
  appointmentId: string
): Promise<CancelResult> {
  const user = await requireUser()

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
  })

  if (!appointment) {
    return { success: false, error: 'Appointment not found' }
  }

  // Authorization: patient who booked OR the doctor
  const isPatient = appointment.patientId === user.id
  const isDoctor = appointment.doctorId === user.id

  if (!isPatient && !isDoctor) {
    return { success: false, error: 'Forbidden' }
  }

  if (
    appointment.status === AppointmentStatus.CANCELLED ||
    appointment.status === AppointmentStatus.COMPLETED
  ) {
    return {
      success: false,
      error: `Appointment is already ${appointment.status.toLowerCase()}`,
    }
  }

  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.CANCELLED },
  })

  return { success: true, data: { appointmentId } }
}

// ─── getMyAppointments (patient) ──────────────────────────────────────────────

export type GetMyAppointmentsResult = ActionResult<AppointmentWithDetails[]>

/**
 * Returns all appointments for the currently logged-in patient.
 * Ordered newest first.
 */
export async function getMyAppointments(): Promise<GetMyAppointmentsResult> {
  const user = await requireUser()

  const rows = await db.appointment.findMany({
    where: { patientId: user.id },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
          doctorProfile: {
            select: {
              id: true,
              specialty: true,
              photoUrl: true,
              consultationFee: true,
              city: true,
            },
          },
        },
      },
      patient: {
        select: { id: true, name: true, email: true },
      },
      payment: {
        select: {
          id: true,
          status: true,
          amount: true,
          transactionId: true,
        },
      },
    },
    orderBy: { startsAt: 'desc' },
  })

  return { success: true, data: rows as AppointmentWithDetails[] }
}

// ─── getAppointmentById ───────────────────────────────────────────────────────

export type GetAppointmentResult = ActionResult<AppointmentWithDetails>

/**
 * Returns a single appointment by ID.
 * Requires the caller to be the patient OR the doctor.
 */
export async function getAppointmentById(
  appointmentId: string
): Promise<GetAppointmentResult> {
  const user = await requireUser()

  const row = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          email: true,
          doctorProfile: {
            select: {
              id: true,
              specialty: true,
              photoUrl: true,
              consultationFee: true,
              city: true,
            },
          },
        },
      },
      patient: {
        select: { id: true, name: true, email: true },
      },
      payment: {
        select: {
          id: true,
          status: true,
          amount: true,
          transactionId: true,
        },
      },
    },
  })

  if (!row) return { success: false, error: 'Appointment not found' }

  if (row.patientId !== user.id && row.doctorId !== user.id) {
    return { success: false, error: 'Forbidden' }
  }

  return { success: true, data: row as AppointmentWithDetails }
}
