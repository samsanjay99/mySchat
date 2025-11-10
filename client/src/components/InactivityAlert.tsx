import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield } from 'lucide-react';

interface InactivityAlertProps {
  onClose: () => void;
}

export function InactivityAlert({ onClose }: InactivityAlertProps) {
  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-2">
            <Shield className="h-8 w-8 text-yellow-500" />
          </div>
          <AlertDialogTitle className="text-center">Session Expired</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            For your security, you have been logged out due to inactivity. 
            Please sign in again to continue using Schat.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center">
          <AlertDialogAction
            onClick={onClose}
            className="whatsapp-bg hover:whatsapp-dark-bg text-white"
          >
            Sign In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 