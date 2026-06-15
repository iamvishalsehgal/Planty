import { Button } from "@/components/Button";

export function EmptyState({ emoji = "🌱", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-cream-200/60 flex items-center justify-center mb-6 shadow-glass-sm">
        <span className="text-5xl">{emoji}</span>
      </div>
      <h3 className="text-title-lg text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-body-md text-text-tertiary mb-6 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <Button label={action.label} onClick={action.onClick} variant="primary" size="md" />
      )}
    </div>
  );
}
