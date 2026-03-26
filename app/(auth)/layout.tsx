import { AmbientGlow } from '@/components/shared/ambient-glow';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen">
      <AmbientGlow variant="auth" />
      {children}
    </div>
  );
}
