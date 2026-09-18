import { NextResponse } from 'next/server';
import { agentService, ScenarioType } from '@/services/agent';
import { dynamicWallet } from '@/services/dynamic';

export async function POST(req: Request) {
  try {
    await dynamicWallet.initialize();
    const body = await req.json().catch(() => ({}));
    const scenario: ScenarioType = body.scenario || 'volatility_spike';

    const newCycle = await agentService.runCycle(scenario);
    return NextResponse.json({
      success: true,
      cycle: newCycle,
      spend: dynamicWallet.getSpendState(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        spend: dynamicWallet.getSpendState(),
      },
      { status: 400 }
    );
  }
}
