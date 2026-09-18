import { NextResponse } from 'next/server';
import { agentService } from '@/services/agent';
import { dynamicWallet } from '@/services/dynamic';

// The feed must reflect the live in-memory cycle history, not a build-time
// snapshot (test.md §5.3).
export const dynamic = 'force-dynamic';

export async function GET() {
  await dynamicWallet.initialize();
  const feed = agentService.getFeedHistory();
  const spend = dynamicWallet.getSpendState();

  return NextResponse.json({
    feed,
    spend,
  });
}
