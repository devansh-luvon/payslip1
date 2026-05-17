/**
 * SMS + OTP service.
 * Uses Twilio in production; logs to console in development.
 */

let twilioClient: import("twilio").Twilio | null = null;

function getTwilio() {
  if (twilioClient) return twilioClient;
  const { default: Twilio } = require("twilio") as { default: typeof import("twilio").Twilio };
  twilioClient = new Twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
  return twilioClient;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function otpExpiry(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 10); // 10-minute window
  return d;
}

export async function sendOtp(phoneNumber: string, otp: string): Promise<void> {
  const message = `Your PaySlip verification code is: ${otp}. Valid for 10 minutes.`;

  if (process.env.NODE_ENV !== "production") {
    console.log(`[SMS DEV] → ${phoneNumber}: ${message}`);
    return;
  }

  await getTwilio().messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phoneNumber,
  });
}

export async function sendClaimSms(phoneNumber: string, claimUrl: string, amount: string): Promise<void> {
  const message = `You have $${amount} USDC waiting for you on PaySlip. Claim your earnings here: ${claimUrl}`;

  if (process.env.NODE_ENV !== "production") {
    console.log(`[SMS DEV] → ${phoneNumber}: ${message}`);
    return;
  }

  await getTwilio().messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phoneNumber,
  });
}
