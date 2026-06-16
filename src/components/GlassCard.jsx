import { cn } from "@/lib/cn";

const variants = {
  sm: "p-4 rounded-2xl",
  md: "p-5 rounded-2xl",
  lg: "p-6 rounded-3xl",
};

export function GlassCard({ variant = "md", className, children, onClick }) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative bg-cream-50/70 backdrop-blur-2xl border border-white/40 shadow-glass transition-all duration-300 overflow-hidden",
        "before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/30 before:via-white/10 before:to-transparent before:pointer-events-none",
        variants[variant],
        onClick && "cursor-pointer pressable hover:shadow-glass-lg",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </Component>
  );
}
