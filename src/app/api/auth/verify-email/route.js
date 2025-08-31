import { NextResponse } from 'next/server';
import { connect } from '@/lib/dbconfig';
import User from '@/model/userModel';

await connect();

export async function POST(req) {
  try {
    const body = await req.json();
    const email = body.email;
    const otp = body.otp;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, message: 'User already verified' },
        { status: 400 }
      );
    }

    if (
      user.verifyCode !== otp ||
      !user.verifyCodeExpiry ||
      user.verifyCodeExpiry < new Date()
    ) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired code' },
        { status: 400 }
      );
    }

    user.isVerified = true;
    await user.save();

    return NextResponse.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
