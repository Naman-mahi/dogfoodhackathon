// Events layout — inherits Navbar from root layout
// Footer is intentionally hidden for organizer event management screens
// Root Footer component self-hides for organizer/judge roles via role check

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
