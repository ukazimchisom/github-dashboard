// Skeleton components show a pulsing placeholder while content loads.
// Better UX than a spinner because users can see the shape of incoming content.
//
// Usage:
//   <Skeleton className="h-4 w-32" />          ← a line of text
//   <Skeleton className="h-32 w-full" />        ← a card placeholder

import { cn } from "@/lib/utils/cn";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className,
      )}
      {...props}
    />
  );
}
