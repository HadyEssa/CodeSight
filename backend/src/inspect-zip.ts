import fs from 'fs';
import path from 'path';

const projectId = '656c9bd5-7409-41d8-9e53-71c3dbbf8ca5';
const zipPath = path.join(process.cwd(), 'uploads', `${projectId}.zip`);

const buffer = Buffer.alloc(10);
const fd = fs.openSync(zipPath, 'r');
fs.readSync(fd, buffer, 0, 10, 0);
fs.closeSync(fd);

console.log('First 10 bytes:', buffer);
console.log('String:', buffer.toString());
