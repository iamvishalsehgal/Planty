import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-green-600 text-white hover:bg-green-700 shadow-card active:shadow-card-sm",
  secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  ghost: "bg-transparent text-text-secondary hover:bg-gray-200/70",
  destructive: "bg-red-500 text-white hover:bg-red-600 shadow-card active:shadow-card-sm",
};

const sizes = {
  sm: "px-4 py-2 text-[13px] rounded-xl",
  md: "px-5 py-3 text-[14px] rounded-xl",
  lg: "px-8 py-4 text-[15px] rounded-2xl",
};

export function Button({ label, variant = "primary", size = "md", icon, loading, disabled, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 pressable disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="text-base">{icon}</span>
      ) : null}
      {label}
    </button>
  );
}
