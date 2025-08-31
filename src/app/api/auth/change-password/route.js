import { connect } from '@/lib/dbconfig';
import User from '@/model/userModel';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

await connect();

export async function POST(req) {
  try {
    const { email, newPassword, forgotPasswordCode } = await req.json();

    if (!email || !newPassword || !forgotPasswordCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    if (
      user.forgotPasswordCode !== forgotPasswordCode ||
      !user.forgotPasswordExpiry ||
      new Date(user.forgotPasswordExpiry) < new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired password reset link',
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.forgotPasswordCode = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error in change-password API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
