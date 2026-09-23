import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="NEXA AI"
      width={32}
      height={32}
      className={cn("shrink-0 rounded-sm", className)}
    />
  );
}
