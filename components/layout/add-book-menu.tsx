"use client";

import Link from "next/link";
import { ChevronDown, Plus, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AddBookMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add book</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/scan">
            <ScanLine className="h-4 w-4" />
            Scan barcode
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/add">
            <Plus className="h-4 w-4" />
            Add manually
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
