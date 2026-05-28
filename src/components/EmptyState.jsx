/**
 * EmptyState — full-page placeholder shown when a list has no items.
 *
 * Props:
 *   title       — short heading (e.g. "No results", "404")
 *   description — supporting text
 *   action      — optional JSX element rendered below the description
 *                 (typically a Button or Link to guide the user)
 */

export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-6xl mb-4 opacity-30 select-none">🐾</span>
      <h2 className="text-2xl font-bold text-deep">{title}</h2>
      <p className="text-glacial mt-2 max-w-xs">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
