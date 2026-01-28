import Link from "next/link";
import { Button } from "@notra/ui/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 text-base text-muted-foreground max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have
          been moved or deleted.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button render={<Link href="/">Go home</Link>} />
          <Button variant="outline" render={ <Link href="javascript:history.back()">Go back</Link>}/>
        </div>
      </div>
    </div>
  );
}
