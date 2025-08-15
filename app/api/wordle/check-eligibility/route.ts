import { NextRequest, NextResponse } from 'next/server';
import { canPlayWordle, getLastWordlePlay } from '../../../Database/actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    
    if (!wallet) {
      return NextResponse.json({ canPlay: true });
    }

    const canPlay = await canPlayWordle(wallet);
    
    let nextPlayTime = null;
    if (!canPlay) {
      // Get last play time to calculate when they can play next
      const lastPlay = await getLastWordlePlay(wallet);
      if (lastPlay) {
        nextPlayTime = new Date(lastPlay.getTime() + 24 * 60 * 60 * 1000);
      }
    }
    
    return NextResponse.json({ canPlay, nextPlayTime });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return NextResponse.json({ canPlay: true }); // Default to allowing play
  }
}