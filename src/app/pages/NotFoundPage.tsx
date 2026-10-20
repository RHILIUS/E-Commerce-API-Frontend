import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { SimpleHeader } from "@/app/components/SimpleHeader";
import { buttonVariants } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

const NotFoundPage = () => {
  return (
    <div className="flex w-full min-w-0 flex-col">
      <SimpleHeader />

      <main className="flex flex-1 items-center justify-center px-6 py-12 sm:py-20">
        <div className="flex w-full max-w-120 min-w-0 flex-col items-center text-center">
          <div
            aria-hidden="true"
            className="bg-primary/10 text-primary mb-6 flex size-16 items-center justify-center rounded-2xl"
          >
            <img src="/favicon.svg" alt="" className="size-8" />
          </div>
          <p className="text-primary text-7xl leading-none font-bold tracking-tight sm:text-8xl">
            404
          </p>
          <h1 className="mt-6 text-3xl font-semibold text-balance sm:text-4xl">
            Page not found
          </h1>
          <p className="text-muted-foreground mt-4 text-base leading-7 text-pretty">
            We can’t find the page you’re looking for. The link may be
            incorrect, or the page may have moved.
          </p>
          <Link
            to="/"
            className={cn(
              buttonVariants(),
              "mt-8 min-h-11 max-w-full gap-2 px-5 py-3 whitespace-normal",
            )}
          >
            Back to home
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
