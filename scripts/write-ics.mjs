import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IcsMeetingService } from '../dist/generate.ics.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const outDir = path.resolve(__dirname, '..', 'tmp');
  const outFile = path.join(outDir, 'invite.test.ics');
  fs.mkdirSync(outDir, { recursive: true });

  const ics = new IcsMeetingService();
  const startsAt = new Date(Date.now() + 30 * 60 * 1000);

  const payload = {
    title: 'Manual ICS Test Invite',
    description:
      'Attach this file in an email to test calendar invite parsing.',
    location: 'Online',
    url: 'https://meet.example.com/test',
    startsAt,
    durationMinutes: 45,
    organizer: { email: 'organizer@example.com', name: 'Organizer' },
    attendees: [{ email: 'recipient@example.com', name: 'Recipient' }],
    method: 'REQUEST',
    sequence: 0,
    alarm: { triggerMinutesBefore: 10 },
  };

  const base64 = await ics.generateIcs(payload);
  fs.writeFileSync(outFile, Buffer.from(base64, 'base64'));
  console.log(`ICS written to: ${outFile}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
