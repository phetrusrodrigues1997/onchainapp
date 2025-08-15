import { NextRequest, NextResponse } from 'next/server';
import { recordWordlePlay, canPlayWordle } from '../../../Database/actions';

export async function POST(request: NextRequest) {
  try {
    const { wallet } = await request.json();
    
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet required' }, { status: 400 });
    }

    // Double-check eligibility before recording play
    const canPlay = await canPlayWordle(wallet);
    if (!canPlay) {
      return NextResponse.json({ error: 'Cannot play - 24 hour cooldown active' }, { status: 403 });
    }

    await recordWordlePlay(wallet);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording play:', error);
    return NextResponse.json({ error: 'Failed to record play' }, { status: 500 });
  }
}