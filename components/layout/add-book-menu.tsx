"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookCopy, ChevronDown, Plus, ScanLine, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AddBookMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const isStore = session?.user?.isStore === true;

  function handleOpenChange(open: boolean) {
    if (open) {
      if (isStore) {
        router.prefetch("/store/dashboard/books");
      } else {
        router.prefetch("/search");
        router.prefetch("/scan");
        router.prefetch("/add");
      }
    }
  }

  if (isStore) {
    return (
      <Button size="sm" asChild>
        <Link href="/store/dashboard/books">
          <BookCopy className="h-4 w-4" />
          <span className="hidden sm:inline">Inventory</span>
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add book</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/search">
            <Search className="h-4 w-4" />
            Search online
          </Link>
        </DropdownMenuItem>
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
