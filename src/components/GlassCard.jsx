import { cn } from "@/lib/cn";

const variants = {
  sm: "p-4 rounded-2xl",
  md: "p-5 rounded-2xl",
  lg: "p-6 rounded-2xl",
};

export function GlassCard({ variant = "md", className, children, onClick }) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "relative bg-cream-50/60 backdrop-blur-xl border border-cream-200/30 shadow-glass-md transition-all duration-200 overflow-hidden",
        "before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none",
        variants[variant],
        onClick && "cursor-pointer hover:shadow-glass-lg hover:scale-[1.01] active:scale-[0.99]",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </Component>
  );
}
