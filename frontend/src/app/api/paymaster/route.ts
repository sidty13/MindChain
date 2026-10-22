import { NextRequest, NextResponse } from 'next/server';

/**
 * Paymaster Proxy API Route
 * 
 * This proxies requests to the Coinbase Developer Platform Paymaster service
 * to keep the Paymaster URL secure and prevent it from being exposed on the frontend.
 * 
 * The actual Paymaster service URL should be stored in PAYMASTER_SERVICE_URL environment variable.
 */
export async function POST(request: NextRequest) {
  try {
    const paymasterServiceUrl = process.env.PAYMASTER_SERVICE_URL;

    if (!paymasterServiceUrl) {
      console.error('PAYMASTER_SERVICE_URL environment variable is not set');
      return NextResponse.json(
        { error: 'Paymaster service not configured' },
        { status: 500 }
      );
    }

    // Get the request body
    const body = await request.json();

    console.log('🔄 Proxying paymaster request:', {
      method: body.method,
      chainId: body.params?.[0]?.chainId,
    });

    // Forward the request to the actual Paymaster service
    const response = await fetch(paymasterServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Paymaster service error:', errorText);
      return NextResponse.json(
        { error: 'Paymaster service request failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Paymaster response received');

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Paymaster proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Also support GET for health checks
export async function GET() {
  const isConfigured = !!process.env.PAYMASTER_SERVICE_URL;
  
  return NextResponse.json({
    status: isConfigured ? 'configured' : 'not_configured',
    message: isConfigured 
      ? 'Paymaster proxy is ready' 
      : 'PAYMASTER_SERVICE_URL environment variable is not set',
  });
}
