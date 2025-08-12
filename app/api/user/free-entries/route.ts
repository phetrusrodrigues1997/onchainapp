import { NextRequest, NextResponse } from 'next/server';
import { getAvailableFreeEntries, getFreeEntriesBreakdown } from '../../../Database/actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const detailed = searchParams.get('detailed') === 'true';
    
    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
    }

    if (detailed) {
      const breakdown = await getFreeEntriesBreakdown(address);
      return NextResponse.json(breakdown);
    } else {
      const available = await getAvailableFreeEntries(address);
      return NextResponse.json({ available });
    }
  } catch (error) {
    console.error('Error fetching free entries:', error);
    return NextResponse.json({ error: 'Failed to fetch free entries' }, { status: 500 });
  }
}