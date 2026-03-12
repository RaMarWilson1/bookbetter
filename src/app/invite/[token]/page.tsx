// src/app/invite/[token]/page.tsx
import { InviteFlow } from './_components/invite-flow';

export const dynamic = 'force-dynamic';

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InviteFlow token={token} />;
}