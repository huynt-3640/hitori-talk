import { AmbientGlow } from '@/components/shared/ambient-glow';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <AmbientGlow variant="auth" />
      {children}
    </div>
  );
}
