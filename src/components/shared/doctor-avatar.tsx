"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DoctorAvatarProps {
  name: string;
  photoUrl: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: { px: 40, className: "size-10 text-sm" },
  md: { px: 64, className: "size-16 text-base" },
  lg: { px: 96, className: "size-24 text-xl" },
  xl: { px: 128, className: "size-32 text-2xl" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function DoctorAvatar({
  name,
  photoUrl,
  size = "md",
  className,
}: DoctorAvatarProps) {
  const { px, className: sizeClass } = SIZE_MAP[size];
  const initials = getInitials(name);
  const [errored, setErrored] = useState(false);

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center font-semibold text-primary",
        sizeClass,
        className
      )}
    >
      {photoUrl && !errored ? (
        <Image
          src={photoUrl}
          alt={`Photo of ${name}`}
          width={px}
          height={px}
          className="object-cover w-full h-full"
          onError={() => setErrored(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
