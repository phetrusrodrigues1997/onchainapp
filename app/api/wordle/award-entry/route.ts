import { NextRequest, NextResponse } from 'next/server';
import { awardWordleFreeEntry } from '../../../Database/actions';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const success = await awardWordleFreeEntry(walletAddress);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Free entry awarded for Wordle victory!' });
    } else {
      return NextResponse.json({ error: 'Failed to award free entry' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error awarding Wordle free entry:', error);
    return NextResponse.json({ error: 'Failed to award free entry' }, { status: 500 });
  }
}