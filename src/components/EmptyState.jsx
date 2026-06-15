import { Button } from "@/components/Button";

export function EmptyState({ emoji = "🌱", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-cream-200 flex items-center justify-center mb-4">
        <span className="text-3xl">{emoji}</span>
      </div>
      <h3 className="text-title-md text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-body-md text-text-tertiary mb-6 max-w-xs">{description}</p>
      )}
      {action && (
        <Button label={action.label} onClick={action.onClick} variant="primary" />
      )}
    </div>
  );
}
