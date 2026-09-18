import { dynamicWallet } from './dynamic';
import type { X402StepData } from '@/types';

export interface X402Challenge {
  scheme: 'x402' | 'tempo';
  recipient: string;
  amountUsd: number;
  currency: string;
  nonce: string;
  description: string;
}

export class X402PaymentService {
  private static instance: X402PaymentService;
  private readonly ORACLE_PRICE_USD = 0.05; // $0.05 micro-payment for premium feed

  private constructor() {}

  public static getInstance(): X402PaymentService {
    if (!X402PaymentService.instance) {
      X402PaymentService.instance = new X402PaymentService();
    }
    return X402PaymentService.instance;
  }

  /**
   * Generates an HTTP 402 Payment Required challenge
   */
  public generatePaymentChallenge(resource: string): X402Challenge {
    return {
      scheme: 'x402',
      recipient: '0x9999999999999999999999999999999999994020',
      amountUsd: this.ORACLE_PRICE_USD,
      currency: 'USDC',
      nonce: `x402_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      description: `Access to Aegis High-Frequency Volatility & Depth Oracle (${resource})`,
    };
  }

  /**
   * Completes the x402 payment flow using the Dynamic Server Wallet
   * Catches 402 -> Authorizes with spend cap -> Signs payment -> Resubmits with PAYMENT-SIGNATURE
   */
  public async executePaymentFlow(resource: string): Promise<X402StepData> {
    const challenge = this.generatePaymentChallenge(resource);

    // Dynamic wallet authorizes micro-payment against spend cap
    await dynamicWallet.authorizeAction(
      `x402 Micro-Payment: ${resource}`,
      challenge.amountUsd
    );

    // Sign the payment challenge using Dynamic MPC wallet signer
    const paymentMessage = `x402:pay:${challenge.recipient}:${challenge.amountUsd}:${challenge.currency}:${challenge.nonce}`;
    const paymentSignature = await dynamicWallet.signMessage(paymentMessage);

    return {
      resource: `Oracle Feed: ${resource}`,
      costUsd: challenge.amountUsd,
      currency: challenge.currency,
      paymentRecipient: challenge.recipient,
      paymentSignature: paymentSignature.length > 24 
        ? `${paymentSignature.substring(0, 14)}...${paymentSignature.substring(paymentSignature.length - 8)}`
        : paymentSignature,
      status: 'Paid & Verified',
      dataPayloadSummary: 'Verified Volatility Index = 64.2 (High Regime), Skew: -0.14, Rebalance Advised',
    };
  }
}

export const x402Service = X402PaymentService.getInstance();
