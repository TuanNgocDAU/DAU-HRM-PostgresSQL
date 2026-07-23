// Tiện ích băm mật khẩu dùng chung cho toàn bộ ứng dụng.
//
// Lý do tồn tại file này: `crypto.subtle` (Web Crypto API) chỉ khả dụng trong
// "secure context" (HTTPS hoặc localhost). Khi ứng dụng được truy cập qua HTTP
// bằng địa chỉ IP trong mạng LAN (không phải localhost), `crypto.subtle` sẽ là
// `undefined`, dẫn đến lỗi "Cannot read properties of undefined (reading 'digest')".
// Để tránh lỗi này, ta cung cấp một cài đặt SHA-256 thuần JavaScript làm phương
// án dự phòng khi `crypto.subtle` không tồn tại.

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const rightRotate = (x: number, n: number) => (x >>> n) | (x << (32 - n));

// Cài đặt SHA-256 thuần JavaScript (không phụ thuộc crypto.subtle).
const sha256Fallback = (bytes: Uint8Array): string => {
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const msgLen = bytes.length;
  const bitLen = msgLen * 8;

  let totalLen = msgLen + 1;
  while (totalLen % 64 !== 56) totalLen++;
  totalLen += 8;

  const padded = new Uint8Array(totalLen);
  padded.set(bytes);
  padded[msgLen] = 0x80;

  const highLen = Math.floor(bitLen / 0x100000000);
  const lowLen = bitLen >>> 0;
  const dv = new DataView(padded.buffer);
  dv.setUint32(totalLen - 8, highLen);
  dv.setUint32(totalLen - 4, lowLen);

  const w = new Uint32Array(64);
  for (let chunkStart = 0; chunkStart < totalLen; chunkStart += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = dv.getUint32(chunkStart + i * 4);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return [h0, h1, h2, h3, h4, h5, h6, h7].map(toHex).join('');
};

/**
 * Trả về chuỗi hex SHA-256 của một chuỗi văn bản.
 * Ưu tiên dùng Web Crypto API (`crypto.subtle`) nếu khả dụng (secure context),
 * ngược lại sẽ dùng cài đặt SHA-256 thuần JavaScript để tránh lỗi
 * "Cannot read properties of undefined (reading 'digest')" khi chạy qua HTTP/LAN.
 */
export const sha256Hex = async (message: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Nếu vì lý do nào đó crypto.subtle.digest bị lỗi, rơi xuống dùng fallback.
    }
  }

  return sha256Fallback(data);
};

// Hàm băm mật khẩu Argon2 (định dạng giả lập) dùng chung cho toàn bộ ứng dụng.
export const hashPasswordArgon2 = async (password: string): Promise<string> => {
  const hashHex = await sha256Hex(password);
  return `$argon2id$v=19$m=65536,t=3,p=4$${hashHex}`;
};
