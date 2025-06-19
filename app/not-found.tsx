import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import logo from "@/public/images/logo.png"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1e293b] flex flex-col items-center justify-center p-4">
      <div className="relative w-[100px] h-[100px] mb-6">
        <Image src={logo} alt="KinderGrow Logo" fill className="object-contain" priority />
      </div>
      <h1 className="text-4xl font-bold text-[#cbd5e1] mb-4">Page Not Found</h1>
      <p className="text-lg text-[#94a3b8] mb-8 text-center max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Button asChild className="bg-[#2563eb] hover:bg-[#1d4ed8]">
          <Link href="/">Go Home</Link>
        </Button>
        <Button asChild variant="outline" className="border-[#2563eb] text-[#cbd5e1]">
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    </div>
  )
}

