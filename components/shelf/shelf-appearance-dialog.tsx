"use client";

import { ShelfAppearanceForm } from "@/components/shelf/shelf-appearance-form";
import type { UserProfile } from "@/types/user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShelfAppearanceDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShelfAppearanceDialog({
  user,
  open,
  onOpenChange,
}: ShelfAppearanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">Customize shelf</DialogTitle>
        </DialogHeader>

        <ShelfAppearanceForm
          user={user}
          showCancel
          onCancel={() => onOpenChange(false)}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
