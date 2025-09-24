import { NextResponse } from 'next/server';
import { connect } from '@/lib/dbconfig';
import Interview from '@/model/interviewModel';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userid');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userid is required' }, { status: 400 });
    }

    await connect();

    const interviews = await Interview.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: interviews }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user interviews:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


