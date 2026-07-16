/**
 * MediBook — Prisma Seed Script
 *
 * Populates the database with:
 *   - 6 doctors across varied specialties
 *   - 2 demo patient users
 *   - Weekly availability for each doctor
 *   - Sample appointments + payments (so dashboards aren't empty)
 *
 * Run via: pnpm db:seed
 */

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import type { AppointmentStatus, PaymentStatus } from '../src/generated/prisma/enums'
import bcrypt from 'bcryptjs'

// ─── Prisma 7: instantiate with libSQL adapter ────────────────────────────────
// PrismaLibSql takes a libsql Config object directly (not a pre-created client).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// ─── Demo Credentials ────────────────────────────────────────────────────────
// THESE ARE THE DEMO LOGINS — keep in sync with README
const DEMO_PASSWORD = 'Demo@1234'

const PATIENTS = [
  { email: 'patient@medibook.dev', name: 'Priya Sharma' },
  { email: 'patient2@medibook.dev', name: 'Arjun Mehta' },
]

const DOCTORS_DATA = [
  {
    email: 'dr.kapoor@medibook.dev',
    name: 'Dr. Anjali Kapoor',
    specialty: 'Cardiology',
    bio: 'Senior cardiologist with 15+ years of experience in interventional cardiology and heart failure management. Trained at AIIMS Delhi and certified by the American Board of Cardiovascular Medicine.',
    consultationFee: 150000, // Rs 1500 in paise
    city: 'Mumbai',
    photoUrl: 'https://i.pravatar.cc/300?img=47',
    experienceYears: 15,
    ratingAvg: 4.8,
    availability: [
      // Monday, Wednesday, Friday
      { dayOfWeek: 1, startTime: '09:00', endTime: '13:00', slotDuration: 30 },
      { dayOfWeek: 3, startTime: '09:00', endTime: '13:00', slotDuration: 30 },
      { dayOfWeek: 5, startTime: '10:00', endTime: '14:00', slotDuration: 30 },
    ],
  },
  {
    email: 'dr.verma@medibook.dev',
    name: 'Dr. Rohan Verma',
    specialty: 'Dermatology',
    bio: 'Board-certified dermatologist specialising in acne management, cosmetic dermatology, and skin cancer screening. Completed fellowship at Stanford Dermatology.',
    consultationFee: 120000, // Rs 1200 in paise
    city: 'Bangalore',
    photoUrl: 'https://i.pravatar.cc/300?img=12',
    experienceYears: 10,
    ratingAvg: 4.6,
    availability: [
      { dayOfWeek: 1, startTime: '14:00', endTime: '18:00', slotDuration: 30 },
      { dayOfWeek: 2, startTime: '10:00', endTime: '14:00', slotDuration: 30 },
      { dayOfWeek: 4, startTime: '10:00', endTime: '16:00', slotDuration: 30 },
    ],
  },
  {
    email: 'dr.nair@medibook.dev',
    name: 'Dr. Meena Nair',
    specialty: 'Pediatrics',
    bio: 'Paediatric specialist passionate about child health and development. 12 years of clinical experience in neonatology and general paediatrics at top children\'s hospitals.',
    consultationFee: 80000, // Rs 800 in paise
    city: 'Chennai',
    photoUrl: 'https://i.pravatar.cc/300?img=45',
    experienceYears: 12,
    ratingAvg: 4.9,
    availability: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '12:00', slotDuration: 20 },
      { dayOfWeek: 2, startTime: '08:00', endTime: '12:00', slotDuration: 20 },
      { dayOfWeek: 3, startTime: '08:00', endTime: '12:00', slotDuration: 20 },
      { dayOfWeek: 4, startTime: '08:00', endTime: '12:00', slotDuration: 20 },
      { dayOfWeek: 5, startTime: '08:00', endTime: '12:00', slotDuration: 20 },
    ],
  },
  {
    email: 'dr.singh@medibook.dev',
    name: 'Dr. Harpreet Singh',
    specialty: 'General Practice',
    bio: 'Family physician offering comprehensive primary care, preventive health, and chronic disease management. Known for clear communication and a patient-first approach.',
    consultationFee: 60000, // Rs 600 in paise
    city: 'Delhi',
    photoUrl: 'https://i.pravatar.cc/300?img=33',
    experienceYears: 8,
    ratingAvg: 4.5,
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDuration: 15 },
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', slotDuration: 15 },
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotDuration: 15 },
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', slotDuration: 15 },
      { dayOfWeek: 5, startTime: '09:00', endTime: '13:00', slotDuration: 15 },
    ],
  },
  {
    email: 'dr.rao@medibook.dev',
    name: 'Dr. Kavitha Rao',
    specialty: 'Dentistry',
    bio: 'Cosmetic and restorative dentist with expertise in smile design, implants, and orthodontics. Over a decade of experience transforming patient smiles.',
    consultationFee: 90000, // Rs 900 in paise
    city: 'Hyderabad',
    photoUrl: 'https://i.pravatar.cc/300?img=25',
    experienceYears: 11,
    ratingAvg: 4.7,
    availability: [
      { dayOfWeek: 2, startTime: '10:00', endTime: '18:00', slotDuration: 45 },
      { dayOfWeek: 4, startTime: '10:00', endTime: '18:00', slotDuration: 45 },
      { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', slotDuration: 45 },
    ],
  },
  {
    email: 'dr.patel@medibook.dev',
    name: 'Dr. Vivek Patel',
    specialty: 'Orthopedics',
    bio: 'Orthopedic surgeon specialising in sports injuries, joint replacement, and minimally invasive surgery. Faculty at the Indian Orthopaedic Association and trained at Mayo Clinic.',
    consultationFee: 200000, // Rs 2000 in paise
    city: 'Ahmedabad',
    photoUrl: 'https://i.pravatar.cc/300?img=8',
    experienceYears: 18,
    ratingAvg: 4.9,
    availability: [
      { dayOfWeek: 1, startTime: '15:00', endTime: '19:00', slotDuration: 30 },
      { dayOfWeek: 3, startTime: '15:00', endTime: '19:00', slotDuration: 30 },
      { dayOfWeek: 5, startTime: '15:00', endTime: '19:00', slotDuration: 30 },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a Date for the next occurrence of dayOfWeek (0=Sun...6=Sat) at HH:MM. */
function nextWeekday(dayOfWeek: number, time: string, offsetWeeks = 0): Date {
  const [h, m] = time.split(':').map(Number)
  const now = new Date()
  const todayDay = now.getDay()
  let daysAhead = dayOfWeek - todayDay
  if (daysAhead <= 0) daysAhead += 7
  const d = new Date(now)
  d.setDate(now.getDate() + daysAhead + offsetWeeks * 7)
  d.setHours(h, m, 0, 0)
  return d
}

/** Returns a Date offsetting from a base by the given number of minutes. */
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding MediBook database...\n')

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  // ── 1. Patients ────────────────────────────────────────────
  const patientUsers: Array<{ id: string; email: string; name: string }> = []

  for (const p of PATIENTS) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        name: p.name,
        passwordHash,
        role: 'PATIENT',
      },
    })
    patientUsers.push(user)
    console.log(`  Patient created: ${user.email}`)
  }

  // ── 2. Doctors + DoctorProfiles + Availability ─────────────
  const doctorUsers: Array<{
    id: string
    email: string
    consultationFee: number
    profile: { id: string }
  }> = []

  for (const d of DOCTORS_DATA) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        name: d.name,
        passwordHash,
        role: 'DOCTOR',
      },
    })

    const profile = await prisma.doctorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        specialty: d.specialty,
        bio: d.bio,
        consultationFee: d.consultationFee,
        city: d.city,
        photoUrl: d.photoUrl,
        ratingAvg: d.ratingAvg,
        experienceYears: d.experienceYears,
        isAcceptingAppointments: true,
      },
    })

    // Upsert availability slots
    for (const slot of d.availability) {
      await prisma.availabilitySlot.upsert({
        where: {
          doctorId_dayOfWeek_startTime: {
            doctorId: profile.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
          },
        },
        update: {},
        create: {
          doctorId: profile.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotDuration: slot.slotDuration,
        },
      })
    }

    doctorUsers.push({
      id: user.id,
      email: user.email,
      consultationFee: d.consultationFee,
      profile: { id: profile.id },
    })
    console.log(`  Doctor created:  ${user.email}  (${d.specialty}, ${d.city})`)
  }

  // ── 3. Sample Appointments + Payments ──────────────────────
  // We create a handful of appointments spread across statuses so the dashboards
  // show meaningful data. Appointments reference the User.id for doctorId/patientId.

  type ApptSeed = {
    patientId: string
    doctorId: string
    startsAt: Date
    endsAt: Date
    status: AppointmentStatus
    reason: string
    fee: number
    paymentStatus: PaymentStatus
  }

  const appointments: ApptSeed[] = [
    // Cardiologist — upcoming CONFIRMED (next Monday 09:00)
    {
      patientId: patientUsers[0].id,
      doctorId: doctorUsers[0].id,
      startsAt: nextWeekday(1, '09:00'),
      endsAt: nextWeekday(1, '09:30'),
      status: 'CONFIRMED',
      reason: 'Routine cardiac check-up and ECG review',
      fee: doctorUsers[0].consultationFee,
      paymentStatus: 'PAID',
    },
    // Dermatologist — upcoming PENDING (next Tuesday 14:00)
    {
      patientId: patientUsers[0].id,
      doctorId: doctorUsers[1].id,
      startsAt: nextWeekday(2, '14:00'),
      endsAt: nextWeekday(2, '14:30'),
      status: 'PENDING',
      reason: 'Persistent acne treatment consultation',
      fee: doctorUsers[1].consultationFee,
      paymentStatus: 'PENDING',
    },
    // Paediatrician — COMPLETED (last week, simulated as 8 days ago)
    {
      patientId: patientUsers[0].id,
      doctorId: doctorUsers[2].id,
      startsAt: (() => {
        const d = new Date()
        d.setDate(d.getDate() - 8)
        d.setHours(8, 0, 0, 0)
        return d
      })(),
      endsAt: (() => {
        const d = new Date()
        d.setDate(d.getDate() - 8)
        d.setHours(8, 20, 0, 0)
        return d
      })(),
      status: 'COMPLETED',
      reason: 'Child vaccination schedule consultation',
      fee: doctorUsers[2].consultationFee,
      paymentStatus: 'PAID',
    },
    // General Practice — CANCELLED (patient2, next Wednesday)
    {
      patientId: patientUsers[1].id,
      doctorId: doctorUsers[3].id,
      startsAt: nextWeekday(3, '09:00'),
      endsAt: addMinutes(nextWeekday(3, '09:00'), 15),
      status: 'CANCELLED',
      reason: 'Annual health checkup',
      fee: doctorUsers[3].consultationFee,
      paymentStatus: 'FAILED',
    },
    // Orthopedic — upcoming CONFIRMED (patient2, next Monday 15:00)
    {
      patientId: patientUsers[1].id,
      doctorId: doctorUsers[5].id,
      startsAt: nextWeekday(1, '15:00'),
      endsAt: nextWeekday(1, '15:30'),
      status: 'CONFIRMED',
      reason: 'Knee pain assessment and X-ray review',
      fee: doctorUsers[5].consultationFee,
      paymentStatus: 'PAID',
    },
    // Dentist — upcoming PENDING (patient2, next Saturday 10:00)
    {
      patientId: patientUsers[1].id,
      doctorId: doctorUsers[4].id,
      startsAt: nextWeekday(6, '10:00'),
      endsAt: addMinutes(nextWeekday(6, '10:00'), 45),
      status: 'PENDING',
      reason: 'Teeth whitening and routine cleaning consultation',
      fee: doctorUsers[4].consultationFee,
      paymentStatus: 'PENDING',
    },
  ]

  for (const appt of appointments) {
    // Use upsert based on unique constraint [doctorId, startsAt]
    const appointment = await prisma.appointment.upsert({
      where: {
        doctorId_startsAt: {
          doctorId: appt.doctorId,
          startsAt: appt.startsAt,
        },
      },
      update: {},
      create: {
        patientId: appt.patientId,
        doctorId: appt.doctorId,
        startsAt: appt.startsAt,
        endsAt: appt.endsAt,
        status: appt.status,
        reason: appt.reason,
      },
    })

    // Upsert payment (1-1)
    await prisma.payment.upsert({
      where: { appointmentId: appointment.id },
      update: {},
      create: {
        appointmentId: appointment.id,
        amount: appt.fee,
        status: appt.paymentStatus,
        provider: 'mock',
        transactionId:
          appt.paymentStatus === 'PAID'
            ? `mock_txn_${appointment.id.slice(-8)}`
            : null,
      },
    })
  }

  console.log(`\n  Appointments + payments seeded: ${appointments.length}`)

  // ── 4. Summary ─────────────────────────────────────────────
  const [userCount, doctorCount, profileCount, slotCount, apptCount, paymentCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'DOCTOR' } }),
      prisma.doctorProfile.count(),
      prisma.availabilitySlot.count(),
      prisma.appointment.count(),
      prisma.payment.count(),
    ])

  console.log('\n' + '='.repeat(50))
  console.log('  MediBook seed complete!')
  console.log('='.repeat(50))
  console.log(`  Users total:        ${userCount}`)
  console.log(`  Doctors:            ${doctorCount}`)
  console.log(`  Doctor profiles:    ${profileCount}`)
  console.log(`  Availability slots: ${slotCount}`)
  console.log(`  Appointments:       ${apptCount}`)
  console.log(`  Payments:           ${paymentCount}`)
  console.log('\n  Demo login credentials (all share the same password):')
  console.log(`  Password: ${DEMO_PASSWORD}`)
  console.log('\n  PATIENTS:')
  for (const p of patientUsers) {
    console.log(`    ${p.email}`)
  }
  console.log('\n  DOCTORS:')
  for (const d of doctorUsers) {
    console.log(`    ${d.email}`)
  }
  console.log('='.repeat(50) + '\n')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
