import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { RegisterForm } from "./register-form";
import { Stethoscope } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Create Account",
};

interface RegisterPageProps {
  searchParams: Promise<{ role?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "DOCTOR" ? "/doctor" : "/dashboard");
  }

  const params = await searchParams;
  const defaultRole = params.role === "DOCTOR" ? "DOCTOR" : "PATIENT";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center size-12 rounded-2xl bg-primary/10 mx-auto mb-4">
            <Stethoscope size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Join MediBook to book appointments instantly
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-card shadow-md p-6">
          <RegisterForm defaultRole={defaultRole as "PATIENT" | "DOCTOR"} />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
