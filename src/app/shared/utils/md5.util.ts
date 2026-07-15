/**
 * Lightweight MD5 hash implementation for Gravatar URL generation.
 * Pure TypeScript — no external dependencies.
 */
export function md5(str: string): string {
  function cmn(
    q: number,
    a: number,
    b: number,
    x: number,
    s: number,
    t: number,
  ): number {
    return add32((((a + q + x + t) >>> 0) << s) | ((a + q + x + t) >>> (32 - s)), b);
  }

  function ff(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ): number {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  function gg(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ): number {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  function hh(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ): number {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ): number {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function add32(a: number, b: number): number {
    return ((a + b) & 0xffffffff) >>> 0;
  }

  function toUtf8(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      let cp = str.codePointAt(i)!;
      if (cp < 0x80) {
        bytes.push(cp);
      } else if (cp < 0x800) {
        bytes.push(0xc0 | (cp >>> 6), 0x80 | (cp & 0x3f));
      } else if (cp < 0x10000) {
        bytes.push(
          0xe0 | (cp >>> 12),
          0x80 | ((cp >>> 6) & 0x3f),
          0x80 | (cp & 0x3f),
        );
      } else {
        i++;
        bytes.push(
          0xf0 | (cp >>> 18),
          0x80 | ((cp >>> 12) & 0x3f),
          0x80 | ((cp >>> 6) & 0x3f),
          0x80 | (cp & 0x3f),
        );
      }
    }
    return bytes;
  }

  const utf8Bytes = toUtf8(str);
  const len = utf8Bytes.length;

  // Padding
  utf8Bytes.push(0x80);
  while ((utf8Bytes.length % 64) !== 56) {
    utf8Bytes.push(0);
  }

  // Append bit length (low 32 bits first, then high 32 bits)
  const bitLen = len * 8;
  for (let i = 0; i < 4; i++) {
    utf8Bytes.push((bitLen >>> (i * 8)) & 0xff);
  }
  for (let i = 0; i < 4; i++) {
    utf8Bytes.push(0);
  }

  const M: number[] = [];
  for (let i = 0; i < utf8Bytes.length; i += 4) {
    M.push(
      utf8Bytes[i] |
        (utf8Bytes[i + 1] << 8) |
        (utf8Bytes[i + 2] << 16) |
        (utf8Bytes[i + 3] << 24),
    );
  }

  let A = 0x67452301;
  let B = 0xefcdab89;
  let C = 0x98badcfe;
  let D = 0x10325476;

  for (let k = 0; k < M.length; k += 16) {
    let a = A,
      b = B,
      c = C,
      d = D;

    // Round 1
    a = ff(a, b, c, d, M[k + 0], 7, 0xd76aa478);
    d = ff(d, a, b, c, M[k + 1], 12, 0xe8c7b756);
    c = ff(c, d, a, b, M[k + 2], 17, 0x242070db);
    b = ff(b, c, d, a, M[k + 3], 22, 0xc1bdceee);
    a = ff(a, b, c, d, M[k + 4], 7, 0xf57c0faf);
    d = ff(d, a, b, c, M[k + 5], 12, 0x4787c62a);
    c = ff(c, d, a, b, M[k + 6], 17, 0xa8304613);
    b = ff(b, c, d, a, M[k + 7], 22, 0xfd469501);
    a = ff(a, b, c, d, M[k + 8], 7, 0x698098d8);
    d = ff(d, a, b, c, M[k + 9], 12, 0x8b44f7af);
    c = ff(c, d, a, b, M[k + 10], 17, 0xffff5bb1);
    b = ff(b, c, d, a, M[k + 11], 22, 0x895cd7be);
    a = ff(a, b, c, d, M[k + 12], 7, 0x6b901122);
    d = ff(d, a, b, c, M[k + 13], 12, 0xfd987193);
    c = ff(c, d, a, b, M[k + 14], 17, 0xa679438e);
    b = ff(b, c, d, a, M[k + 15], 22, 0x49b40821);

    // Round 2
    a = gg(a, b, c, d, M[k + 1], 5, 0xf61e2562);
    d = gg(d, a, b, c, M[k + 6], 9, 0xc040b340);
    c = gg(c, d, a, b, M[k + 11], 14, 0x265e5a51);
    b = gg(b, c, d, a, M[k + 0], 20, 0xe9b6c7aa);
    a = gg(a, b, c, d, M[k + 5], 5, 0xd62f105d);
    d = gg(d, a, b, c, M[k + 10], 9, 0x02441453);
    c = gg(c, d, a, b, M[k + 15], 14, 0xd8a1e681);
    b = gg(b, c, d, a, M[k + 4], 20, 0xe7d3fbc8);
    a = gg(a, b, c, d, M[k + 9], 5, 0x21e1cde6);
    d = gg(d, a, b, c, M[k + 14], 9, 0xc33707d6);
    c = gg(c, d, a, b, M[k + 3], 14, 0xf4d50d87);
    b = gg(b, c, d, a, M[k + 8], 20, 0x455a14ed);
    a = gg(a, b, c, d, M[k + 13], 5, 0xa9e3e905);
    d = gg(d, a, b, c, M[k + 2], 9, 0xfcefa3f8);
    c = gg(c, d, a, b, M[k + 7], 14, 0x676f02d9);
    b = gg(b, c, d, a, M[k + 12], 20, 0x8d2a4c8a);

    // Round 3
    a = hh(a, b, c, d, M[k + 5], 4, 0xfffa3942);
    d = hh(d, a, b, c, M[k + 8], 11, 0x8771f681);
    c = hh(c, d, a, b, M[k + 11], 16, 0x6d9d6122);
    b = hh(b, c, d, a, M[k + 14], 23, 0xfde5380c);
    a = hh(a, b, c, d, M[k + 1], 4, 0xa4beea44);
    d = hh(d, a, b, c, M[k + 4], 11, 0x4bdecfa9);
    c = hh(c, d, a, b, M[k + 7], 16, 0xf6bb4b60);
    b = hh(b, c, d, a, M[k + 10], 23, 0xbebfbc70);
    a = hh(a, b, c, d, M[k + 13], 4, 0x289b7ec6);
    d = hh(d, a, b, c, M[k + 0], 11, 0xeaa127fa);
    c = hh(c, d, a, b, M[k + 3], 16, 0xd4ef3085);
    b = hh(b, c, d, a, M[k + 6], 23, 0x04881d05);
    a = hh(a, b, c, d, M[k + 9], 4, 0xd9d4d039);
    d = hh(d, a, b, c, M[k + 12], 11, 0xe6db99e5);
    c = hh(c, d, a, b, M[k + 15], 16, 0x1fa27cf8);
    b = hh(b, c, d, a, M[k + 2], 23, 0xc4ac5665);

    // Round 4
    a = ii(a, b, c, d, M[k + 0], 6, 0xf4292244);
    d = ii(d, a, b, c, M[k + 7], 10, 0x432aff97);
    c = ii(c, d, a, b, M[k + 14], 15, 0xab9423a7);
    b = ii(b, c, d, a, M[k + 5], 21, 0xfc93a039);
    a = ii(a, b, c, d, M[k + 12], 6, 0x655b59c3);
    d = ii(d, a, b, c, M[k + 3], 10, 0x8f0ccc92);
    c = ii(c, d, a, b, M[k + 10], 15, 0xffeff47d);
    b = ii(b, c, d, a, M[k + 1], 21, 0x85845dd1);
    a = ii(a, b, c, d, M[k + 8], 6, 0x6fa87e4f);
    d = ii(d, a, b, c, M[k + 15], 10, 0xfe2ce6e0);
    c = ii(c, d, a, b, M[k + 6], 15, 0xa3014314);
    b = ii(b, c, d, a, M[k + 13], 21, 0x4e0811a1);
    a = ii(a, b, c, d, M[k + 4], 6, 0xf7537e82);
    d = ii(d, a, b, c, M[k + 11], 10, 0xbd3af235);
    c = ii(c, d, a, b, M[k + 2], 15, 0x2ad7d2bb);
    b = ii(b, c, d, a, M[k + 9], 21, 0xeb86d391);

    A = add32(A, a);
    B = add32(B, b);
    C = add32(C, c);
    D = add32(D, d);
  }

  function toHex(val: number): string {
    const hex: string[] = [];
    for (let i = 0; i < 4; i++) {
      const b = (val >>> (i * 8)) & 0xff;
      hex.push(b.toString(16).padStart(2, '0'));
    }
    return hex.join('');
  }

  return toHex(A) + toHex(B) + toHex(C) + toHex(D);
}
