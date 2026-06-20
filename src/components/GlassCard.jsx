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
        "relative bg-white border border-gray-200/40 shadow-card transition-all duration-300 overflow-hidden rounded-2xl",
        variants[variant],
        onClick && "cursor-pointer pressable hover:shadow-card-lg",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </Component>
  );
}
