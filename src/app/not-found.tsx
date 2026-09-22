import Link from "next/link";
import { BrandMark } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <BrandMark />
        <h1 className="mt-6 text-3xl font-bold">This page isn&apos;t available</h1>
        <p className="mt-2 text-muted-foreground">The link may be broken or the page may have been removed.</p>
        <Link href="/" className="mt-4 inline-block text-[#0866FF]">
          Go to News Feed
        </Link>
      </div>
    </div>
  );
}
