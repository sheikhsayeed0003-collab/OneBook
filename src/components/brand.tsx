import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold tracking-tight", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-[#0866FF] text-lg text-white shadow-sm">
        O
      </span>
      <span className="text-[28px] leading-none text-[#0866FF]">{appConfig.name}</span>
    </span>
  );
}
