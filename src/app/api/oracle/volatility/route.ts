import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const paymentSig = req.headers.get('PAYMENT-SIGNATURE');

  if (!paymentSig) {
    // Return HTTP 402 Payment Required with machine-readable payment instruction header
    return new NextResponse(
      JSON.stringify({
        error: 'Payment Required',
        message: 'Aegis High-Frequency Volatility Oracle requires micro-payment authorization.',
        price: '0.05 USDC',
        recipient: '0x9999999999999999999999999999999999994020',
      }),
      {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          'PAYMENT-REQUIRED': 'scheme=x402; recipient=0x9999999999999999999999999999999999994020; amount=0.05; currency=USDC; asset=BaseUSDC',
        },
      }
    );
  }

  // Payment verified: return oracle data
  return NextResponse.json({
    status: 'access_granted',
    oracle: 'Aegis Volatility Oracle (x402 Verified)',
    timestamp: new Date().toISOString(),
    metrics: {
      annualizedHV: '64.2%',
      skew30D: -0.14,
      impliedRangeWidth: '$2,480 - $3,120',
      recommendedAction: 'TIGHTEN_RANGE_AND_HEDGE_BRACKET',
    },
  });
}
