// import nodemailer from 'nodemailer';
// import { IcsMeetingService } from '../src/generate.ics.service';

// async function main() {
//   const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL, TO_EMAIL } =
//     process.env as Record<string, string>;

//   if (
//     !SMTP_HOST ||
//     !SMTP_PORT ||
//     !SMTP_USER ||
//     !SMTP_PASS ||
//     !FROM_EMAIL ||
//     !TO_EMAIL
//   ) {
//     console.error(
//       'Missing required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL, TO_EMAIL',
//     );
//     process.exit(1);
//   }

//   const transporter = nodemailer.createTransport({
//     host: SMTP_HOST,
//     port: Number(SMTP_PORT),
//     secure: Number(SMTP_PORT) === 465,
//     auth: { user: SMTP_USER, pass: SMTP_PASS },
//   });

//   const icsService = new IcsMeetingService();
//   const startsAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

//   const payload = {
//     title: 'Test ICS Invite',
//     description: 'This is a test meeting invite sent via ICS attachment.',
//     location: 'Online',
//     url: 'https://meet.google.com/test-abc',
//     startsAt,
//     durationMinutes: 45,
//     organizer: { email: FROM_EMAIL, name: 'ICS Tester' },
//     attendees: [{ email: TO_EMAIL, name: 'Recipient' }],
//     method: 'REQUEST',
//     sequence: 0,
//     alarm: { triggerMinutesBefore: 10 },
//   };

//   const base64Ics = await icsService.generateIcs(payload);

//   const info = await transporter.sendMail({
//     from: FROM_EMAIL,
//     to: TO_EMAIL,
//     subject: 'ICS Test Invite (REQUEST)',
//     text: 'Your calendar client should detect the attached invite.',
//     attachments: [
//       {
//         filename: 'invite.ics',
//         content: base64Ics,
//         encoding: 'base64',
//         contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
//       },
//     ],
//   });

//   console.log('Message sent:', info.messageId);
// }

// main().catch((err) => {
//   console.error(err);
//   process.exit(1);
// });
