import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div>
        <h1 className="text-2xl font-bold">Permission denied</h1>
        <p className="text-muted-foreground">You don&apos;t have access to this area.</p>
        <Link href="/" className="mt-3 inline-block text-[#0866FF]">
          Back home
        </Link>
      </div>
    </div>
  );
}
