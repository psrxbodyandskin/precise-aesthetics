type Params = { slug: string };

export default async function ProtocolDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  await params;
  return <div className="container mx-auto px-6 py-32" />;
}
