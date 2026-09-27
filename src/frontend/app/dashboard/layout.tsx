// Dashboard layout — inherits Navbar from root layout
// Footer is intentionally omitted (root Footer hides itself for organizer/judge via role check)
// This layout ensures the dashboard segment has no extra footer wrapper

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
