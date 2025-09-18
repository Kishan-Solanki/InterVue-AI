import { connect } from '@/lib/dbconfig';
import User from '@/model/userModel';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signJwtToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

await connect();

export async function POST(req) {
  try {
    const body = await req.json();
    const email = body.email;
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 }); // Changed to 404
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Email not verified', redirectTo: '/verifyemail' },
        { status: 403 }
      );
    }

    const token = signJwtToken({ id: user._id });

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ message: 'Login successful', success: true }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}