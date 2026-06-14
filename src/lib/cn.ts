// ClassName merge utility for NativeWind
// NativeWind v4 doesn't export cn — simple truthy filter + join
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
