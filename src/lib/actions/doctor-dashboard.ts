'use server'
// ============================================================
// MediBook — Doctor dashboard actions
//
// getDoctorAppointments   — all appointments for a doctor
// confirmAppointment      — doctor confirms a PENDING appointment
// cancelAppointmentDoc    — doctor cancels an appointment
// getMyAvailability       — fetch the doctor's weekly slots
// setAvailability         — replace weekly availability (CRUD)
// getDoctorDashboardStats — summary counts for the dashboard
// ============================================================

import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { AppointmentStatus, Role } from '@/generated/prisma/enums'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export type SlotInput = {
  dayOfWeek: number    // 0–6
  startTime: string    // "HH:MM"
  endTime: string      // "HH:MM"
  slotDuration: number // minutes
}

export type AvailabilitySlotRecord = SlotInput & { id: string }

export type DoctorAppointmentItem = {
  id: string
  startsAt: Date
  endsAt: Date
  status: AppointmentStatus
  reason: string | null
  notes: string | null
  createdAt: Date
  patient: {
    id: string
    name: string
    email: string
  }
}

// ─── Helper: resolve DoctorProfile from current user ─────────────────────────

async function getMyDoctorProfile(userId: string) {
  return db.doctorProfile.findUnique({ where: { userId } })
}

// ─── getMyDoctorDetail ────────────────────────────────────────────────────────

/**
 * Returns the full DoctorDetail for the currently logged-in doctor,
 * regardless of isAcceptingAppointments status.
 * Used by the doctor dashboard to populate the profile editor.
 */
export async function getMyDoctorDetail(): Promise<ActionResult<import('@/lib/actions/doctors').DoctorDetail>> {
  const user = await requireRole(Role.DOCTOR)

  const profile = await db.doctorProfile.findUnique({
    where: { userId: user.id },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      availabilitySlots: {
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
    },
  })

  if (!profile) {
    return { success: false, error: 'Doctor profile not found' }
  }

  return {
    success: true,
    data: {
      id: profile.id,
      userId: profile.userId,
      name: profile.user.name,
      email: profile.user.email,
      specialty: profile.specialty,
      bio: profile.bio,
      consultationFee: profile.consultationFee,
      city: profile.city,
      photoUrl: profile.photoUrl,
      ratingAvg: profile.ratingAvg,
      experienceYears: profile.experienceYears,
      isAcceptingAppointments: profile.isAcceptingAppointments,
      availabilitySlots: profile.availabilitySlots.map((s) => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        slotDuration: s.slotDuration,
      })),
    },
  }
}

// ─── getDoctorAppointments ────────────────────────────────────────────────────

const DoctorAppointmentsSchema = z.object({
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])
    .optional(),
})

/**
 * Returns appointments for the currently logged-in doctor.
 * Optionally filtered by status.
 */
export async function getDoctorAppointments(filters?: {
  status?: AppointmentStatus
}): Promise<ActionResult<DoctorAppointmentItem[]>> {
  const user = await requireRole(Role.DOCTOR)

  const rows = await db.appointment.findMany({
    where: {
      doctorId: user.id,
      ...(filters?.status ? { status: filters.status } : {}),
    },
    include: {
      patient: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { startsAt: 'asc' },
  })

  return { success: true, data: rows as DoctorAppointmentItem[] }
}

// ─── confirmAppointment (doctor-side) ────────────────────────────────────────

/**
 * Doctor manually confirms a PENDING appointment (e.g. before payment).
 */
export async function confirmAppointment(
  appointmentId: string
): Promise<ActionResult<{ appointmentId: string }>> {
  const user = await requireRole(Role.DOCTOR)

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
  })

  if (!appointment) {
    return { success: false, error: 'Appointment not found' }
  }

  if (appointment.doctorId !== user.id) {
    return { success: false, error: 'Forbidden' }
  }

  if (appointment.status !== AppointmentStatus.PENDING) {
    return {
      success: false,
      error: `Appointment is already ${appointment.status.toLowerCase()}`,
    }
  }

  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: AppointmentStatus.CONFIRMED },
  })

  return { success: true, data: { appointmentId } }
}

// ─── cancelAppointmentDoc (doctor-side) ──────────────────────────────────────

/**
 * Doctor cancels an appointment.
 */
export async function cancelAppointmentDoc(
  appointmentId: string
): Promise<ActionResult<{ appointmentId: string }>> {
  const user = await requireRole(Role.DOCTOR)

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
  })

  if (!appointment) {
    return { success: false, error: 'Appointment not found' }
  }

  if (appointment.doctorId !== user.id) {
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

// ─── getMyAvailability ────────────────────────────────────────────────────────

/**
 * Returns the doctor's weekly availability slots.
 */
export async function getMyAvailability(): Promise<
  ActionResult<AvailabilitySlotRecord[]>
> {
  const user = await requireRole(Role.DOCTOR)

  const profile = await getMyDoctorProfile(user.id)
  if (!profile) {
    return { success: false, error: 'Doctor profile not found' }
  }

  const slots = await db.availabilitySlot.findMany({
    where: { doctorId: profile.id },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })

  return {
    success: true,
    data: slots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotDuration: s.slotDuration,
    })),
  }
}

// ─── setAvailability ──────────────────────────────────────────────────────────

const SlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  slotDuration: z.number().int().min(10).max(120),
})

const SetAvailabilitySchema = z.array(SlotSchema)

/**
 * Fully replaces the doctor's weekly availability.
 * Deletes all existing slots and inserts the provided list.
 * Pass an empty array to clear all availability.
 */
export async function setAvailability(
  slots: SlotInput[]
): Promise<ActionResult<{ count: number }>> {
  const user = await requireRole(Role.DOCTOR)

  const parsed = SetAvailabilitySchema.safeParse(slots)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join('; ')
    return { success: false, error: `Invalid slot data: ${issues}` }
  }

  const profile = await getMyDoctorProfile(user.id)
  if (!profile) {
    return { success: false, error: 'Doctor profile not found' }
  }

  // Replace atomically
  await db.$transaction([
    db.availabilitySlot.deleteMany({ where: { doctorId: profile.id } }),
    db.availabilitySlot.createMany({
      data: parsed.data.map((s) => ({
        doctorId: profile.id,    // AvailabilitySlot.doctorId = DoctorProfile.id
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        slotDuration: s.slotDuration,
      })),
    }),
  ])

  return { success: true, data: { count: parsed.data.length } }
}

// ─── getDoctorDashboardStats ──────────────────────────────────────────────────

export type DoctorStats = {
  todayCount: number
  pendingCount: number
  confirmedCount: number
  totalCount: number
}

/**
 * Returns summary appointment stats for the doctor's dashboard.
 */
export async function getDoctorDashboardStats(): Promise<
  ActionResult<DoctorStats>
> {
  const user = await requireRole(Role.DOCTOR)

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const [todayCount, pendingCount, confirmedCount, totalCount] =
    await Promise.all([
      db.appointment.count({
        where: {
          doctorId: user.id,
          startsAt: { gte: todayStart, lt: todayEnd },
          status: {
            in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
          },
        },
      }),
      db.appointment.count({
        where: { doctorId: user.id, status: AppointmentStatus.PENDING },
      }),
      db.appointment.count({
        where: { doctorId: user.id, status: AppointmentStatus.CONFIRMED },
      }),
      db.appointment.count({ where: { doctorId: user.id } }),
    ])

  return {
    success: true,
    data: { todayCount, pendingCount, confirmedCount, totalCount },
  }
}

// ─── updateDoctorProfile ──────────────────────────────────────────────────────

const UpdateProfileSchema = z.object({
  specialty: z.string().min(2).optional(),
  bio: z.string().max(1000).optional(),
  consultationFee: z.number().int().min(0).optional(), // paise
  city: z.string().min(2).optional(),
  photoUrl: z.string().url().optional(),
  experienceYears: z.number().int().min(0).optional(),
  isAcceptingAppointments: z.boolean().optional(),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>

/**
 * Updates the currently logged-in doctor's profile fields.
 */
export async function updateDoctorProfile(
  input: UpdateProfileInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole(Role.DOCTOR)

  const parsed = UpdateProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Invalid profile data' }
  }

  const profile = await getMyDoctorProfile(user.id)
  if (!profile) {
    return { success: false, error: 'Doctor profile not found' }
  }

  const updated = await db.doctorProfile.update({
    where: { id: profile.id },
    data: parsed.data,
  })

  return { success: true, data: { id: updated.id } }
}
