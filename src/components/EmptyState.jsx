import { Button } from "@/components/Button";

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-page-in">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center mb-6 shadow-card">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4F7A42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v2" />
          <path d="M9 5c-3 1-5 4-5 7 0 4 3.5 7 8 7s8-3 8-7c0-3-2-6-5-7" />
          <path d="M12 7c-2 0-4 2-4 4 0 2.5 2 4.5 4 4.5s4-2 4-4.5c0-2-2-4-4-4z" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </div>
      <h3 className="text-title-lg text-text-primary mb-2 tracking-tight">{title}</h3>
      {description && (
        <p className="text-[15px] text-text-tertiary mb-8 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <Button label={action.label} onClick={action.onClick} variant="primary" size="md" />
      )}
    </div>
  );
}
