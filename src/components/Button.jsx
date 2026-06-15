import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-sage-600 text-white hover:bg-sage-700 shadow-card",
  secondary: "bg-soil-100 text-soil-800 hover:bg-soil-200",
  ghost: "bg-transparent text-text-secondary hover:bg-cream-200",
  destructive: "bg-clay-500 text-white hover:bg-clay-600",
};

const sizes = {
  sm: "px-3 py-1.5 text-label-sm rounded-sm",
  md: "px-5 py-2.5 text-label-md rounded-md",
  lg: "px-8 py-4 text-body-lg rounded-lg",
};

export function Button({ label, variant = "primary", size = "md", icon, loading, disabled, onClick, className }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="text-lg">{icon}</span>
      ) : null}
      {label}
    </button>
  );
}
