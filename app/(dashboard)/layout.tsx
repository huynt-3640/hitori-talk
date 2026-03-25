export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar - hidden on mobile */}
      <aside className="hidden w-[var(--sidebar-width)] shrink-0 md:block">
        {/* Sidebar will be implemented here */}
      </aside>

      {/* Main content */}
      <main className="flex-1 pb-[var(--bottom-nav-height)] md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav - hidden on desktop */}
      <nav className="fixed inset-x-0 bottom-0 h-[var(--bottom-nav-height)] md:hidden">
        {/* Bottom nav will be implemented here */}
      </nav>
    </div>
  );
}
