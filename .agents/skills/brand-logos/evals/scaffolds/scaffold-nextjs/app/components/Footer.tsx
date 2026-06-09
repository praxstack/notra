import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
        <p className="text-sm text-neutral-500">© 2026 Acme, Inc.</p>
        <div className="flex items-center gap-4">
          {/* Social/brand logos go here */}
        </div>
      </div>
    </footer>
  );
}
