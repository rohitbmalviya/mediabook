'use server'
// ============================================================
// MediBook — Doctor listing & profile actions
// ============================================================

import { z } from 'zod'
import { db } from '@/lib/db'

// ─── Input schemas ────────────────────────────────────────────────────────────

const GetDoctorsSchema = z.object({
  specialty: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type DoctorListItem = {
  id: string            // DoctorProfile.id
  userId: string        // User.id (needed for Appointment.doctorId)
  name: string
  specialty: string
  bio: string
  consultationFee: number // paise
  city: string
  photoUrl: string
  ratingAvg: number
  experienceYears: number
  isAcceptingAppointments: boolean
}

export type DoctorDetail = DoctorListItem & {
  email: string
  availabilitySlots: {
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    slotDuration: number
  }[]
}

// ─── getDoctors ───────────────────────────────────────────────────────────────

/**
 * Returns all doctors with optional filtering.
 * search matches against name, specialty, city, or bio (case-insensitive, SQLite LIKE).
 */
export async function getDoctors(filters?: {
  specialty?: string
  city?: string
  search?: string
}): Promise<DoctorListItem[]> {
  const parsed = GetDoctorsSchema.parse(filters ?? {})
  const { specialty, city, search } = parsed

  const profiles = await db.doctorProfile.findMany({
    where: {
      isAcceptingAppointments: true,
      ...(specialty ? { specialty: { contains: specialty } } : {}),
      ...(city ? { city: { contains: city } } : {}),
      ...(search
        ? {
            OR: [
              { specialty: { contains: search } },
              { city: { contains: search } },
              { bio: { contains: search } },
              { user: { name: { contains: search } } },
            ],
          }
        : {}),
    },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { ratingAvg: 'desc' },
  })

  return profiles.map((p) => ({
    id: p.id,
    userId: p.userId,
    name: p.user.name,
    specialty: p.specialty,
    bio: p.bio,
    consultationFee: p.consultationFee,
    city: p.city,
    photoUrl: p.photoUrl,
    ratingAvg: p.ratingAvg,
    experienceYears: p.experienceYears,
    isAcceptingAppointments: p.isAcceptingAppointments,
  }))
}

// ─── getDoctorById ────────────────────────────────────────────────────────────

/**
 * Returns full doctor profile by DoctorProfile.id.
 * Includes weekly availability slots.
 * Returns null if not found.
 */
export async function getDoctorById(
  profileId: string
): Promise<DoctorDetail | null> {
  const profile = await db.doctorProfile.findUnique({
    where: { id: profileId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      availabilitySlots: {
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
    },
  })

  if (!profile) return null

  return {
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
  }
}

// ─── getSpecialties / getCities — for filter dropdowns ───────────────────────

export async function getSpecialties(): Promise<string[]> {
  const results = await db.doctorProfile.findMany({
    select: { specialty: true },
    distinct: ['specialty'],
    orderBy: { specialty: 'asc' },
  })
  return results.map((r) => r.specialty)
}

export async function getCities(): Promise<string[]> {
  const results = await db.doctorProfile.findMany({
    select: { city: true },
    distinct: ['city'],
    orderBy: { city: 'asc' },
  })
  return results.map((r) => r.city)
}
