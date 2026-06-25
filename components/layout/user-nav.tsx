"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="size-8 shrink-0 rounded-lg bg-muted animate-pulse" aria-hidden />
    );
  }

  if (!session?.user) {
    return (
      <Button variant="ghost" size="sm" asChild className="text-sm">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8 shrink-0 rounded-lg"
          aria-label="Account menu"
        >
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium truncate">{session.user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/sessions">Your sessions</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/analyze">New analysis</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
