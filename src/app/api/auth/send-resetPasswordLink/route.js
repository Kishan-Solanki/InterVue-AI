import { NextResponse } from 'next/server';
import { connect } from '@/lib/dbconfig';
import User from '@/model/userModel';
import { sendForgotPasswordEmail } from '@/helpers/mailer';
import crypto from 'crypto';

await connect();

export async function POST(req) {
  try {
    const body = await req.json();
    const email = body.email;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Valid email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Email not found' }, { status: 404 });
    }

    // Generate secure reset token and expiry
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    user.forgotPasswordCode = resetToken;
    user.forgotPasswordExpiry = expiry;
    await user.save();

    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL}/change-password/${resetToken}`;

    await sendForgotPasswordEmail(user.email, user.username, resetLink);

    return NextResponse.json({
      success: true,
      message: 'Reset password link sent to your email',
    });
  } catch (error) {
    console.error('Error in send-resetPasswordLink route:', error);
    return NextResponse.json({
      success: false,
      message: 'Something went wrong while sending reset link',
    }, { status: 500 });
  }
}
