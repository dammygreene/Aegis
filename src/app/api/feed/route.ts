import { NextResponse } from 'next/server';
import { agentService } from '@/services/agent';
import { dynamicWallet } from '@/services/dynamic';

export async function GET() {
  await dynamicWallet.initialize();
  const feed = agentService.getFeedHistory();
  const spend = dynamicWallet.getSpendState();

  return NextResponse.json({
    feed,
    spend,
  });
}
