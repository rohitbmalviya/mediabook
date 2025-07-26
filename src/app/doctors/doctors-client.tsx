"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { getDoctors } from "@/lib/actions/doctors";
import type { DoctorListItem } from "@/lib/actions/doctors";
import { formatPaise } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { DoctorAvatar } from "@/components/shared/doctor-avatar";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Star,
  Clock,
  X,
  Stethoscope,
} from "lucide-react";

interface DoctorsClientProps {
  initialDoctors: DoctorListItem[];
  specialties: string[];
  cities: string[];
  initialFilters: {
    specialty?: string;
    city?: string;
    search?: string;
  };
}

interface Filters {
  specialty: string;
  city: string;
  search: string;
}

function DoctorCard({ doctor }: { doctor: DoctorListItem }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
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
            <p className="text-sm text-primary mt-0.5">{doctor.specialty}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <MapPin size={11} />
              <span className="truncate">{doctor.city}</span>
            </div>
          </div>
          {doctor.isAcceptingAppointments ? (
            <Badge className="shrink-0 bg-chart-1/10 text-chart-1 border border-chart-1/20 text-xs py-0.5 px-2 rounded-full">
              Available
            </Badge>
          ) : (
            <Badge className="shrink-0 bg-muted text-muted-foreground text-xs py-0.5 px-2 rounded-full">
              Unavailable
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between py-3 border-t border-border">
          <div className="flex items-center gap-1 text-sm">
            <Star size={13} className="text-chart-4" fill="currentColor" />
            <span className="font-medium text-foreground">
              {doctor.ratingAvg.toFixed(1)}
            </span>
            <span className="text-muted-foreground">rating</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock size={12} />
            <span>{doctor.experienceYears}y exp</span>
          </div>
          <span className="font-semibold text-foreground">
            {formatPaise(doctor.consultationFee)}
          </span>
        </div>
      </div>

      <div className="px-5 pb-5">
        <Link href={`/doctors/${doctor.id}`}>
          <Button className="w-full" size="sm">
            Book Now
          </Button>
        </Link>
      </div>
    </div>
  );
}

function FilterSidebar({
  filters,
  specialties,
  cities,
  onFilterChange,
  onClear,
}: {
  filters: Filters;
  specialties: string[];
  cities: string[];
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClear: () => void;
}) {
  const hasActiveFilters =
    filters.specialty !== "" || filters.city !== "" || filters.search !== "";

  return (
    <aside className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-foreground">Filters</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground h-auto p-0 hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-1.5">
        <label
          htmlFor="search-input"
          className="text-sm font-medium text-foreground"
        >
          Search
        </label>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            id="search-input"
            placeholder="Name, specialty, city..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Specialty */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">Specialty</p>
        <Select
          value={filters.specialty || "all"}
          onValueChange={(v) =>
            onFilterChange("specialty", !v || v === "all" ? "" : v)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All specialties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All specialties</SelectItem>
            {specialties.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">City</p>
        <Select
          value={filters.city || "all"}
          onValueChange={(v) => onFilterChange("city", !v || v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </aside>
  );
}

export function DoctorsClient({
  initialDoctors,
  specialties,
  cities,
  initialFilters,
}: DoctorsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [doctors, setDoctors] = useState<DoctorListItem[]>(initialDoctors);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    specialty: initialFilters.specialty ?? "",
    city: initialFilters.city ?? "",
    search: initialFilters.search ?? "",
  });

  const applyFilters = useCallback(
    async (newFilters: Filters) => {
      setIsLoading(true);
      try {
        const result = await getDoctors({
          specialty: newFilters.specialty || undefined,
          city: newFilters.city || undefined,
          search: newFilters.search || undefined,
        });
        setDoctors(result);

        const params = new URLSearchParams(searchParams.toString());
        if (newFilters.specialty) {
          params.set("specialty", newFilters.specialty);
        } else {
          params.delete("specialty");
        }
        if (newFilters.city) {
          params.set("city", newFilters.city);
        } else {
          params.delete("city");
        }
        if (newFilters.search) {
          params.set("search", newFilters.search);
        } else {
          params.delete("search");
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } catch {
        // keep current results
      } finally {
        setIsLoading(false);
      }
    },
    [pathname, router, searchParams]
  );

  const handleFilterChange = useCallback(
    (key: keyof Filters, value: string) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);

      if (key === "search") {
        const timer = setTimeout(() => applyFilters(newFilters), 400);
        return () => clearTimeout(timer);
      } else {
        applyFilters(newFilters);
      }
    },
    [filters, applyFilters]
  );

  const handleClear = useCallback(() => {
    const cleared: Filters = { specialty: "", city: "", search: "" };
    setFilters(cleared);
    applyFilters(cleared);
  }, [applyFilters]);

  const hasActiveFilters =
    filters.specialty !== "" || filters.city !== "" || filters.search !== "";

  return (
    <div className="flex gap-8">
      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 shrink-0">
        <div className="sticky top-24 rounded-xl border border-border bg-card shadow-sm p-5">
          <FilterSidebar
            filters={filters}
            specialties={specialties}
            cities={cities}
            onFilterChange={handleFilterChange}
            onClear={handleClear}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile: filter button + results header */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Mobile filter sheet */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[min(var(--radius-md),12px)] border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <SlidersHorizontal size={14} />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 size-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                      !
                    </span>
                  )}
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filter Doctors</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 py-4">
                    <FilterSidebar
                      filters={filters}
                      specialties={specialties}
                      cities={cities}
                      onFilterChange={handleFilterChange}
                      onClear={handleClear}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    {doctors.length}
                  </span>{" "}
                  doctor{doctors.length !== 1 ? "s" : ""} found
                </>
              )}
            </p>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              {filters.specialty && (
                <button
                  onClick={() => handleFilterChange("specialty", "")}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 text-xs py-0.5 px-2 rounded-full hover:bg-primary/20 transition-colors"
                >
                  {filters.specialty}
                  <X size={10} />
                </button>
              )}
              {filters.city && (
                <button
                  onClick={() => handleFilterChange("city", "")}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 text-xs py-0.5 px-2 rounded-full hover:bg-primary/20 transition-colors"
                >
                  {filters.city}
                  <X size={10} />
                </button>
              )}
              {filters.search && (
                <button
                  onClick={() => handleFilterChange("search", "")}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 text-xs py-0.5 px-2 rounded-full hover:bg-primary/20 transition-colors"
                >
                  &ldquo;{filters.search}&rdquo;
                  <X size={10} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results grid */}
        {isLoading ? (
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
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Stethoscope size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No doctors found
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Try adjusting your filters or search term to find more results.
            </p>
            <Button variant="outline" onClick={handleClear}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
