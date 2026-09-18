import { NextResponse } from 'next/server';
import { agentService } from '@/services/agent';
import { dynamicWallet } from '@/services/dynamic';

export async function POST() {
  agentService.resetFeed();
  return NextResponse.json({
    success: true,
    feed: agentService.getFeedHistory(),
    spend: dynamicWallet.getSpendState(),
  });
}
