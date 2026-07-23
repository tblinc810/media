import { NextResponse } from 'next/server';
import Cloudflare from 'cloudflare';

// Initialize the Cloudflare client.
// By default, it will look for the CLOUDFLARE_API_TOKEN environment variable.
const client = new Cloudflare({
  // We provide a fallback empty string just to satisfy TypeScript if the env var isn't set,
  // but you MUST have CLOUDFLARE_API_TOKEN set in your .env.local for this to work.
  apiToken: process.env.CLOUDFLARE_API_TOKEN || '', 
});

export async function GET() {
  try {
    // As an example, let's fetch a list of your Cloudflare zones (domains).
    // You can replace this with whatever Cloudflare API interaction you need.
    const zones = await client.zones.list();
    
    const zoneData = [];
    for await (const zone of zones) {
      zoneData.push({ id: zone.id, name: zone.name, status: zone.status });
    }

    return NextResponse.json({ success: true, zones: zoneData });
  } catch (error: any) {
    console.error('Cloudflare API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to communicate with Cloudflare' },
      { status: 500 }
    );
  }
}
