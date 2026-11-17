export function byteRange(header: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!match || (!match[1] && !match[2]) || size <= 0) return null;
  const [, start, end] = match;
  if (!start) {
    const suffix = Number(end);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    const length = Math.min(suffix, size);
    return { offset: size - length, length };
  }
  const offset = Number(start);
  const last = end ? Number(end) : size - 1;
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(last) || offset >= size || last < offset) return null;
  return { offset, length: Math.min(last, size - 1) - offset + 1 };
}

export async function readSourceAudio(storage: R2Bucket, key: string, rangeHeader: string | null) {
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "Content-Type": "audio/wav",
    "X-Content-Type-Options": "nosniff",
  });
  if (!rangeHeader) {
    const file = await storage.get(key);
    if (!file) return null;
    headers.set("Content-Length", String(file.size));
    return new Response(file.body, { headers });
  }

  const file = await storage.head(key);
  if (!file) return null;
  const range = byteRange(rangeHeader, file.size);
  if (!range) {
    headers.set("Content-Range", "bytes */" + file.size);
    return new Response(null, { status: 416, headers });
  }
  const part = await storage.get(key, { range });
  if (!part) return null;
  headers.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${file.size}`);
  headers.set("Content-Length", String(range.length));
  return new Response(part.body, { status: 206, headers });
}
