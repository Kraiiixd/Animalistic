/** Badge role di samping username. Role "user" (non-premium) tidak memiliki badge. */
const ROLE_BADGE: Record<string, { src: string; label: string }> = {
  developer: { src: "/badges/developer.png", label: "Developer" },
  admin: { src: "/badges/admin.png", label: "Admin" },
  moderator: { src: "/badges/moderator.png", label: "Moderator" },
  beta: { src: "/badges/beta.png", label: "Beta Tester" },
  premium: { src: "/badges/premium.png", label: "Premium" },
};

export function RoleBadge({ role, className = "size-5" }: { role: string; className?: string }) {
  const badge = ROLE_BADGE[role];
  if (!badge) return null;
  return <img src={badge.src} alt={`Badge ${badge.label}`} title={badge.label} className={`${className} shrink-0 select-none`} draggable={false} />;
}
