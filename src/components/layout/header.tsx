import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Stethoscope, LayoutDashboard, LogOut } from "lucide-react";
import { MobileNav } from "./mobile-nav";

export async function Header() {
  const user = await getCurrentUser();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Stethoscope className="text-primary-foreground" size={18} />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              MediBook
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button variant="ghost" size="sm">
                Home
              </Button>
            </Link>
            <Link href="/doctors">
              <Button variant="ghost" size="sm">
                Find Doctors
              </Button>
            </Link>
          </nav>

          {/* Desktop Auth Actions */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="User menu"
                >
                  <Avatar size="default">
                    <AvatarImage src={undefined} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground max-w-32 truncate">
                    {user.name}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                      {user.email}
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link
                      href={user.role === "DOCTOR" ? "/doctor" : "/dashboard"}
                      className="flex items-center gap-2 w-full"
                    >
                      <LayoutDashboard size={14} />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <form action={logoutAction} className="w-full">
                      <button
                        type="submit"
                        className="flex items-center gap-2 w-full text-left text-destructive"
                      >
                        <LogOut size={14} />
                        Log out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="default" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <MobileNav user={user} />
        </div>
      </div>
    </header>
  );
}
