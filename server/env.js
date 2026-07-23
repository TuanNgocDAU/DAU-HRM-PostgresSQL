import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Nạp biến môi trường theo đúng thứ tự ưu tiên của Vite, và luôn tính đường dẫn
// từ vị trí file này để `npm run server` chạy được bất kể thư mục hiện hành.
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const file of ['.env.local', '.env']) {
  dotenv.config({ path: path.join(rootDir, file) });
}

export { rootDir };
