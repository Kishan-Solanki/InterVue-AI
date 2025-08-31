import { NextResponse } from 'next/server';
import { connect } from '@/lib/dbconfig';
import User from '@/model/userModel';
import { sendVerificationEmail } from '@/helpers/mailer';
import { generateVerificationCode } from '@/lib/utils';

await connect();

export async function POST(req) {
  try {
    const body = await req.json();
    const email = body.email;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ success: false, message: 'User is already verified' }, { status: 400 });
    }

    const newCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 1000 * 60 * 30); // 30 mins from now

    user.verifyCode = newCode;
    user.verifyCodeExpiry = codeExpiry;
    await user.save();

    const mailResult = await sendVerificationEmail(email, user.username, newCode);

    if (!mailResult.success) {
      return NextResponse.json({ success: false, message: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Verification code resent successfully' });
  } catch (error) {
    console.error('Resend code error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
