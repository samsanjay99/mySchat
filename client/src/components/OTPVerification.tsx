import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Shield, MailCheck } from "lucide-react";

interface OTPVerificationProps {
  email: string;
  onVerificationSuccess: () => void;
  onBackToLogin: () => void;
}

export function OTPVerification({ email, onVerificationSuccess, onBackToLogin }: OTPVerificationProps) {
  const [otp, setOTP] = useState("");
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const response = await apiRequest("POST", "/api/auth/verify", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email verified!",
        description: "You can now sign in to your account",
      });
      onVerificationSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const resendOTPMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/resend-otp", { email });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "OTP Sent",
        description: "A new verification code has been sent to your email",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send OTP",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast({
        title: "OTP required",
        description: "Please enter the verification code sent to your email",
        variant: "destructive",
      });
      return;
    }
    verifyMutation.mutate({ email, otp });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Shield className="h-10 w-10 text-green-500" />
        </div>
        <CardTitle className="text-xl">Verify Your Email</CardTitle>
        <p className="text-secondary-custom text-sm mt-1">
          We've sent a verification code to<br />
          <span className="font-medium text-primary-custom">{email}</span>
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-wider"
              autoComplete="one-time-code"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full whatsapp-bg hover:whatsapp-dark-bg text-white"
            disabled={verifyMutation.isPending}
          >
            {verifyMutation.isPending ? "Verifying..." : "Verify Email"}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2 pt-0">
        <div className="text-sm text-center">
          <span className="text-secondary-custom">Didn't receive the code? </span>
          <button
            type="button"
            onClick={() => resendOTPMutation.mutate(email)}
            className="text-green-600 font-medium hover:underline"
            disabled={resendOTPMutation.isPending}
          >
            {resendOTPMutation.isPending ? "Sending..." : "Resend"}
          </button>
        </div>
        
        <div className="text-sm text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-secondary-custom hover:text-primary-custom hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </CardFooter>
    </Card>
  );
} 