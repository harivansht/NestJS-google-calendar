function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatDateUtc(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

export function nowUtcStamp(): string {
  return formatDateUtc(new Date());
}

export function escapeText(text: string): string {
  // RFC 5545 escaping for TEXT values
  return (text || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n|\r\n|\r/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

export function foldLine(line: string): string {
  // RFC 5545: Lines of text SHOULD NOT be longer than 75 octets. Soft fold with CRLF + space
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    let end = Math.min(start + 75, bytes.length);
    // avoid cutting a multi-byte character
    while (end > start) {
      const slice = bytes.slice(start, end);
      try {
        const str = slice.toString('utf8');
        parts.push((start === 0 ? '' : ' ') + str);
        start = end;
        break;
      } catch {
        end--; // back off
      }
    }
    if (end === start) break;
  }
  // First part has no leading space; subsequent parts start with a space per RFC
  if (parts.length > 0) {
    parts[0] = parts[0].startsWith(' ') ? parts[0].slice(1) : parts[0];
  }
  return parts.join('\r\n');
}

export function buildProp(
  name: string,
  params: Record<string, string> | undefined,
  value: string,
): string {
  const paramStr =
    params && Object.keys(params).length
      ? ';' +
        Object.entries(params)
          .map(([k, v]) => `${k}=${v}`)
          .join(';')
      : '';
  return `${name.toUpperCase()}${paramStr}:${value}`;
}

export function crlfJoin(lines: Array<string | undefined | null>): string {
  return lines.filter(Boolean).join('\r\n');
}
