export async function sendVerificationEmail(email, username, verifyCode) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_VERIFICATION_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('Missing EmailJS environment variables.');
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: '*',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          email,
          username,
          otp: verifyCode,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`EmailJS error: ${errorData}`);
    }

    return { success: true, message: 'Verification email sent successfully' };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, message: 'Failed to send verification email' };
  }
}

export async function sendForgotPasswordEmail(email, username, resetLink) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_FORGOT_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('Missing EmailJS environment variables.');
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: '*',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          email,
          username,
          reset_link: resetLink,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`EmailJS error: ${errorData}`);
    }

    return { success: true, message: 'Forgot password email sent successfully' };
  } catch (error) {
    console.error('Error sending forgot password email:', error);
    return { success: false, message: 'Failed to send reset link email' };
  }
}
