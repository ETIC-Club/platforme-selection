export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  await params // Ensure params is consumed
  return <>{children}</>
}
