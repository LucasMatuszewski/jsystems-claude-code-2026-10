"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { texts } from "@/lib/case/texts";

export type NewCaseDialogProps = {
  onConfirm: () => void;
};

export function NewCaseDialog({ onConfirm }: NewCaseDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="lg" variant="outline">
          {texts.chat.newCase}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{texts.newCaseDialog.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {texts.newCaseDialog.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{texts.newCaseDialog.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {texts.newCaseDialog.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
