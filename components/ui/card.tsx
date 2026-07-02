// A Card is a white box with a border and shadow.
// Almost every dashboard widget sits inside a card.
// i build it as a set of composable sub-components:
//   <Card>
//     <CardHeader>
//       <CardTitle>Title</CardTitle>
//       <CardDescription>Subtitle</CardDescription>
//     </CardHeader>
//     <CardContent>...content...</CardContent>
//   </Card>

import { cn } from "@/lib/utils/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-xl border border-gray-200 bg-white", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: CardProps) {
  return (
    <h3
      className={cn(
        "text-sm font-medium text-gray-500 leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: CardProps) {
  return <p className={cn("text-xs text-gray-400", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}
