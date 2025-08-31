import { connect } from '@/lib/dbconfig';
import User from '@/model/userModel';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import { sendVerificationEmail } from '@/helpers/mailer';
import { generateVerificationCode } from '@/lib/utils';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

await connect();

export async function POST(req) {
  try {
    const formData = await req.formData();

    const username = formData.get('username')?.toString();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const file = formData.get('profileImage');

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profileImageURL = 'https://res.cloudinary.com/divwkpavu/image/upload/v1749458831/default_qtcr88.jpg';

    if (file && typeof file.arrayBuffer === 'function') {
      const buffer = Buffer.from(await file.arrayBuffer());

      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'users' }, (err, result) => {
          if (err) {
            console.error('Cloudinary upload error:', err);
            return reject(err);
          }
          if (!result) {
            console.error('No result from Cloudinary');
            return reject(new Error('No result from Cloudinary'));
          }
          resolve({ secure_url: result.secure_url });
        });
        stream.end(buffer);
      });

      profileImageURL = uploaded.secure_url;
    }

    const verifyCode = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 1000 * 60 * 30); // 30 mins

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      profileImageURL,
      verifyCode,
      verifyCodeExpiry: codeExpiry,
      isVerified: false,
    });

    const savedUser = await newUser.save();

    const mailResult = await sendVerificationEmail(email, username, verifyCode);

    if (!mailResult.success) {
      console.error('Verification mail failed:', mailResult.message);

      return NextResponse.json(
        {
          success: true,
          warning: 'User registered but failed to send verification email. Please request a new code.',
          user: savedUser,
        },
        { status: 207 }
      );
    }

    return NextResponse.json({
      message: 'User registered successfully! Verification email sent.',
      success: true,
      user: savedUser,
    });
  } catch (error) {
    console.error('Sign-up error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
