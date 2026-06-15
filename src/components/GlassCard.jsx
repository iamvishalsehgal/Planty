import { cn } from "@/lib/cn";

const variants = {
  sm: "p-4 rounded-md",
  md: "p-5 rounded-lg",
  lg: "p-6 rounded-xl",
};

export function GlassCard({ variant = "md", className, children, onClick }) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "bg-cream-50/70 backdrop-blur-xl border border-cream-200/50 shadow-glass-md transition-all",
        variants[variant],
        onClick && "cursor-pointer hover:shadow-glass-lg active:scale-[0.98]",
        className
      )}
    >
      {children}
    </Component>
  );
}
