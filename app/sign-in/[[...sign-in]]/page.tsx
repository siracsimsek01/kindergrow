"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { UserIcon } from "lucide-react";
import logo from "@/public/images/logo.png";

interface LastUser {
  id: string;
  name: string;
  email?: string;
  imageUrl?: string;
  lastSignIn?: string;
  fullName?: string;
}

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectUrl = searchParams?.get("redirect_url") || "/dashboard";
  const [lastUser, setLastUser] = useState<LastUser | null>(null);

  useEffect(() => {
    // Check for last signed in user in localStorage
    const storedUser = localStorage.getItem("lastSignedInUser");
    if (storedUser) {
      try {
        setLastUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }
  }, []);

  const handleContinueAsUser = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Illustration and welcome message */}
      <div className="flex-1 bg-gradient-to-br from-[#1e293b] to-[#334155] p-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[10%] left-[20%] w-20 h-20 rounded-full bg-[#d946ef] animate-float"></div>
          <div className="absolute top-[30%] right-[15%] w-16 h-16 rounded-full bg-[#2563eb] animate-float-delay"></div>
          <div className="absolute bottom-[20%] left-[30%] w-24 h-24 rounded-full bg-[#598EF3] animate-float-slow"></div>
          <div className="absolute bottom-[35%] right-[25%] w-12 h-12 rounded-full bg-[#fae8ff] animate-float-delay-slow"></div>
        </div>

        <div className="relative z-10 max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="relative w-[120px] h-[120px]">
              <Image
                src={logo}
                alt="KinderGrow Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#cbd5e1] mb-4">
            Welcome to KinderGrow
          </h1>
          <p className="text-lg text-[#94a3b8] mb-6">
            Track your little one's growth, sleep, feeding, and more in one
            beautiful app.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#334155]/80 backdrop-blur-sm p-4 rounded-lg shadow-sm">
              <div className="text-3xl mb-2">🍼</div>
              <h3 className="font-medium text-[#cbd5e1]">Feeding Tracking</h3>
            </div>
            <div className="bg-[#334155]/80 backdrop-blur-sm p-4 rounded-lg shadow-sm">
              <div className="text-3xl mb-2">😴</div>
              <h3 className="font-medium text-[#cbd5e1]">Sleep Monitoring</h3>
            </div>
            <div className="bg-[#334155]/80 backdrop-blur-sm p-4 rounded-lg shadow-sm">
              <div className="text-3xl mb-2">📏</div>
              <h3 className="font-medium text-[#cbd5e1]">Growth Charts</h3>
            </div>
            <div className="bg-[#334155]/80 backdrop-blur-sm p-4 rounded-lg shadow-sm">
              <div className="text-3xl mb-2">🧸</div>
              <h3 className="font-medium text-[#cbd5e1]">Milestone Tracking</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Sign in form */}
      <div className="flex-1 bg-[#1e293b] p-8 flex items-center justify-center">
        <div className="w-full max-w-md flex flex-col">
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-[#2563eb] hover:bg-[#1d4ed8] text-sm normal-case",
                card: "bg-[#1e293b] shadow-none border-[#334155]",
                headerTitle: "text-[#cbd5e1]",
                headerSubtitle: "text-[#94a3b8]",
                socialButtonsBlockButton:
                  "border-[#475569] text-[#94a3b8] bg-[#334155]",
                formFieldLabel: "text-[#cbd5e1]",
                formFieldInput:
                  "bg-[#334155] border-[#475569] text-[#cbd5e1] focus:border-[#2563eb] focus:ring-[#2563eb]",
                footerActionText: "text-[#94a3b8]",
                footerActionLink: "text-[#2563eb] hover:text-[#598EF3]",
                logoImage: "h-16 w-16",
                footer: "bg-[#1e293b] border-t-0 text-[#94a3b8]",
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            redirectUrl={redirectUrl}
          />

          {/* "Continue as" card for returning users - moved to bottom */}
          {lastUser && (
            <Card className="mt-6 bg-[#1e293b] border-[#334155] text-[#cbd5e1] flex flex-col gap-3 w-[400px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#cbd5e1] text-lg">
                  Continue as
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center gap-3">
                  {lastUser.imageUrl ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={lastUser.imageUrl || "/placeholder.svg"}
                        alt={lastUser.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#334155] flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-[#cbd5e1]" />
                    </div>
                  )}
                  <div>
                    <p className="text-[#cbd5e1] font-medium">
                      {lastUser.fullName || lastUser.name}
                    </p>
                    {lastUser.email && (
                      <p className="text-[#94a3b8] text-sm">{lastUser.email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-[#1e293b]">
                <Button
                  className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
                  onClick={handleContinueAsUser}
                >
                  Continue
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}