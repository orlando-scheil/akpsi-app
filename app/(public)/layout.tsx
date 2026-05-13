// Public layout — shell for all unauthenticated public-facing pages.
// No auth required. Styled content added in a future design pass.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
