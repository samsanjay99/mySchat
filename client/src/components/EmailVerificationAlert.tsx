import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { sendVerificationEmail, signOutUser } from "@/lib/firebase";
import { MailCheck, ArrowLeft } from "lucide-react";

interface EmailVerificationAlertProps {
  onClose: () => void;
  email: string;
}

export function EmailVerificationAlert({ onClose, email }: EmailVerificationAlertProps) {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleResend = async () => {
    setIsSending(true);
    try {
      await sendVerificationEmail();
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and follow the link to verify your email",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    onClose();
  };

  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-2">
            <MailCheck className="h-8 w-8 text-yellow-500" />
          </div>
          <AlertDialogTitle className="text-center">Verify Your Email</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            A verification email has been sent to <strong>{email}</strong>. 
            Please check your inbox and click the verification link to activate your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col space-y-2">
          <Button
            onClick={handleResend}
            disabled={isSending}
            className="w-full whatsapp-bg hover:whatsapp-dark-bg text-white"
          >
            {isSending ? "Sending..." : "Resend Verification Email"}
          </Button>
          
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-red-500 text-red-500 hover:bg-red-50"
          >
            Sign Out
          </Button>
          
          <Button
            onClick={handleBack}
            variant="ghost"
            className="w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 