import { Suspense } from "react";
import { getDoctors, getSpecialties, getCities } from "@/lib/actions/doctors";
import { DoctorsClient } from "./doctors-client";
import { Skeleton } from "@/components/ui/skeleton";

interface DoctorsPageProps {
  searchParams: Promise<{
    specialty?: string;
    city?: string;
    search?: string;
  }>;
}

function DoctorsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card shadow-sm p-6 flex flex-col gap-4"
        >
          <div className="flex items-start gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

async function DoctorsContent({
  specialty,
  city,
  search,
}: {
  specialty?: string;
  city?: string;
  search?: string;
}) {
  const [doctors, specialties, cities] = await Promise.all([
    getDoctors({ specialty, city, search }),
    getSpecialties(),
    getCities(),
  ]);

  return (
    <DoctorsClient
      initialDoctors={doctors}
      specialties={specialties}
      cities={cities}
      initialFilters={{ specialty, city, search }}
    />
  );
}

export default async function DoctorsPage({ searchParams }: DoctorsPageProps) {
  const params = await searchParams;
  const { specialty, city, search } = params;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Find a Doctor
        </h1>
        <p className="text-muted-foreground mt-1">
          Search and filter from our network of verified specialists
        </p>
      </div>

      <Suspense fallback={<DoctorsLoadingSkeleton />}>
        <DoctorsContent specialty={specialty} city={city} search={search} />
      </Suspense>
    </div>
  );
}
