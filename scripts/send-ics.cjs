const nodemailer = require('nodemailer');
const { IcsMeetingService } = require('../dist/src/generate.ics.service.js');

async function main() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    FROM_EMAIL,
    TO_EMAIL,
    SMTP_SECURE, // optional: 'true' | 'false'
  } = process.env;

  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !FROM_EMAIL ||
    !TO_EMAIL
  ) {
    console.error(
      'Missing env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL, TO_EMAIL',
    );
    process.exit(1);
  }

  const port = Number(SMTP_PORT);
  const secure = SMTP_SECURE ? SMTP_SECURE === 'true' : port === 465;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    requireTLS: !secure, // enforce STARTTLS on 587
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.verify();
    console.log('SMTP connection verified');
  } catch (e) {
    console.error(
      'SMTP verify failed:',
      e?.code || e?.responseCode,
      e?.message || e,
    );
    process.exit(1);
  }

  const icsService = new IcsMeetingService();
  const startsAt = new Date(Date.now() + 45 * 60 * 1000);

  const payload = {
    title: 'Inline ICS Invite Test',
    description: 'This invite should show RSVP UI in Gmail/Outlook.',
    location: 'Online',
    url: 'https://meet.example.com/inline-test',
    startsAt,
    durationMinutes: 30,
    organizer: { email: FROM_EMAIL, name: 'ICS Bot' },
    attendees: [{ email: TO_EMAIL, name: 'Recipient' }],
    method: 'REQUEST',
    sequence: 0,
    alarm: { triggerMinutesBefore: 10 },
  };

  const icsText = icsService.generateIcsText(payload);
  const base64Ics = icsService.generateIcs(payload);

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: 'Inline ICS Invite (UI expected)',
      text: 'Your email client should render the calendar invite.',
      html: '<p>Your email client should render the calendar invite.</p>',
      headers: { 'Content-Class': 'urn:content-classes:calendarmessage' },
      alternatives: [
        {
          contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
          content: icsText,
        },
      ],
      attachments: [
        {
          filename: 'invite.ics',
          content: base64Ics,
          encoding: 'base64',
          contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
          contentDisposition: 'attachment',
        },
      ],
    });
    console.log('Message sent:', info.messageId);
  } catch (e) {
    console.error(
      'Send failed:',
      e?.code || e?.responseCode,
      e?.response || e?.message || e,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
