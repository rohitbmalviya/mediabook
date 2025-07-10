import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./login-form";
import { Stethoscope } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Log In",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "DOCTOR" ? "/doctor" : "/dashboard");
  }

  const params = await searchParams;
  const next = params.next;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center size-12 rounded-2xl bg-primary/10 mx-auto mb-4">
            <Stethoscope size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to manage your appointments
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-card shadow-md p-6">
          <LoginForm next={next} />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          New to MediBook?{" "}
          <Link
            href="/register"
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
