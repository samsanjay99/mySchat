import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { setToken } from "@/lib/utils";
import { createUserWithEmail, signInWithEmail, sendVerificationEmail, getCurrentUser, isEmailVerified } from "@/lib/firebase";
import { EmailVerificationAlert } from "@/components/EmailVerificationAlert";
import { Lock, Mail, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AuthPage() {
  const [tab, setTab] = useState<string>("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  // Check verification status on load
  useEffect(() => {
    const user = getCurrentUser();
    if (user && !isEmailVerified()) {
      setVerificationEmail(user.email || "");
      setShowVerification(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Create user in Firebase and then in our backend
  const signupMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; fullName: string }) => {
      setIsLoading(true);
      try {
        // 1. Create user in Firebase
        const userCredential = await createUserWithEmail(data.email, data.password);
        
        // 2. Send verification email
        await sendVerificationEmail();
        
        // 3. Create user in our backend
        const response = await apiRequest("POST", "/api/auth/firebase/create", {
          email: data.email,
          fullName: data.fullName,
          firebaseUid: userCredential.user.uid
        });
        
        if (!response.ok) {
          const result = await response.json();
          throw new Error(`${response.status}: ${result.message}`);
        }
        
        return { email: data.email };
      } catch (error: any) {
        // Check if this is a "user already exists" error from Firebase
        if (error.code === 'auth/email-already-in-use') {
          // Try to sign in with the provided credentials
          const userCredential = await signInWithEmail(data.email, data.password);
          
          // Create user in our backend anyway (our backend will handle if user already exists)
          await apiRequest("POST", "/api/auth/firebase/create", {
            email: data.email,
            fullName: data.fullName,
            firebaseUid: userCredential.user.uid
          });
          
          return { email: data.email };
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      setIsLoading(false);
      toast({
        title: "Account created!",
        description: "Please verify your email address to continue",
      });
      setVerificationEmail(data.email);
      setShowVerification(true);
    },
    onError: (error: Error) => {
      setIsLoading(false);
      
      // Extract and format the error message for better user experience
      let errorMessage = error.message.replace(/^\d+:\s*/, "");
      
      // Handle common Firebase errors
      if (errorMessage.includes("auth/invalid-email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (errorMessage.includes("auth/weak-password")) {
        errorMessage = "Password should be at least 6 characters.";
      } else if (errorMessage.includes("auth/network-request-failed")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (errorMessage.includes("<!DOCTYPE")) {
        errorMessage = "Server error. Please try again later.";
      }
      
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Sign in with Firebase and then get token from our backend
  const signinMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      setIsLoading(true);
      try {
      // 1. Sign in with Firebase
      const userCredential = await signInWithEmail(data.email, data.password);
      
      // 2. Check if email is verified
      if (!userCredential.user.emailVerified) {
        throw new Error("Email not verified. Please verify your email before logging in.");
      }
      
      // 3. Get token from our backend
        const response = await apiRequest("POST", "/api/auth/firebase/login", {
        firebaseUid: userCredential.user.uid,
        email: data.email
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(`${response.status}: ${result.message}`);
      }
      
      return response.json();
      } catch (error: any) {
        console.error("Sign in error:", error);
        
        // Handle specific Firebase auth errors
        if (error.code === 'auth/user-not-found') {
          throw new Error("No account found with this email. Please check and try again.");
        } else if (error.code === 'auth/wrong-password') {
          throw new Error("Incorrect password. Please try again.");
        } else if (error.code === 'auth/invalid-credential') {
          throw new Error("Invalid email or password. Please try again.");
        } else if (error.code === 'auth/too-many-requests') {
          throw new Error("Too many unsuccessful login attempts. Please try again later.");
        } else if (error.code === 'auth/network-request-failed') {
          throw new Error("Network error. Please check your internet connection.");
        }
        
        throw error;
      }
    },
    onSuccess: (data) => {
      setIsLoading(false);
      setToken(data.token);
      window.location.href = "/";
    },
    onError: (error: Error) => {
      setIsLoading(false);
      let errorMessage = error.message;
      
      // Check if this is an unverified account error
      if (errorMessage.includes("Email not verified")) {
        // Show verification screen
        setVerificationEmail(formData.email);
        setShowVerification(true);
        return;
      }
      
      // Clean up error message for better user experience
      errorMessage = errorMessage.replace(/^\d+:\s*/, "");
      if (errorMessage.includes("<!DOCTYPE")) {
        errorMessage = "Server error. Please try again later.";
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "signin") {
      signinMutation.mutate({
        email: formData.email,
        password: formData.password,
      });
    } else {
      signupMutation.mutate({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
      });
    }
  };

  if (showVerification) {
    return (
      <div className="flex flex-col h-screen p-4">
        <div className="flex-1 flex items-center justify-center">
          <EmailVerificationAlert
            email={verificationEmail}
            onClose={() => {
              setShowVerification(false);
              setTab("signin");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Schat</CardTitle>
            <CardDescription>Messaging made simple</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue={tab}
              value={tab}
              onValueChange={setTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-secondary-custom" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-secondary-custom" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full whatsapp-bg hover:whatsapp-dark-bg text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-secondary-custom" />
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email2">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-secondary-custom" />
                      <Input
                        id="email2"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-secondary-custom" />
                      <Input
                        id="password2"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a password"
                        required
                        className="pl-10"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Password must be at least 6 characters
                      </p>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full whatsapp-bg hover:whatsapp-dark-bg text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-secondary-custom">
              By signing up, you agree to our Terms and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
      <div className="p-4 text-center">
        <p className="text-xs text-secondary-custom">
          © 2023 Schat. All rights reserved.
        </p>
      </div>
    </div>
  );
}
