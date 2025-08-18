import { NextRequest, NextResponse } from 'next/server';
import { getWinnerByDate, addWinner } from '../../../Database/wordledb';
import { awardWordleFreeEntry } from '../../../Database/actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const winners = await getWinnerByDate(date);
    return NextResponse.json({ winners });
  } catch (error) {
    console.error('Error fetching winner:', error);
    return NextResponse.json({ error: 'Failed to fetch winner' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, word, winner } = await request.json();
    
    if (!date || !word) {
      return NextResponse.json({ error: 'Date and word are required' }, { status: 400 });
    }

    await addWinner(date, word, winner);
    
    // Award free entry for Wordle victory if winner has wallet address
    if (winner && winner !== 'Anonymous') {
      try {
        const success = await awardWordleFreeEntry(winner);
        if (success) {
        } else {
          console.error('Failed to award Wordle free entry');
        }
      } catch (awardError) {
        console.error('Error awarding Wordle free entry:', awardError);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding winner:', error);
    return NextResponse.json({ error: 'Failed to add winner' }, { status: 500 });
  }
}