// 生成应用图标源文件 (1024x1024 PNG)
// 简洁工具型：靛蓝底 + 白色"字"字
// 运行: node scripts/gen-icon.mjs
import { writeFileSync } from "fs";
import { createHash } from "crypto";

// 生成一个最小的有效 1024x1024 PNG（纯色 #4f46e5）
// 使用手工构造 PNG（避免外部依赖）
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const W = 1024, H = 1024;
// RGBA: 靛蓝 #4f46e5
const r = 0x4f, g = 0x46, b = 0xe5, a = 0xff;
// 在中心绘制白色"字"字的简化版：用矩形拼一个抽象字形标记
// 为简化，画一个白色圆角矩形块作为占位（实际图标由 tauri icon 处理缩放）
const raw = Buffer.alloc(W * H * 4 + H); // 每行 1 字节 filter + W*4 像素
for (let y = 0; y < H; y++) {
  raw[y * (W * 4 + 1)] = 0; // filter none
  for (let x = 0; x < W; x++) {
    const off = y * (W * 4 + 1) + 1 + x * 4;
    // 中心圆形区域画白色"字"的简化：一个白色圆
    const dx = x - W / 2;
    const dy = y - H / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 280) {
      // 白色圆内
      raw[off] = 255;
      raw[off + 1] = 255;
      raw[off + 2] = 255;
      raw[off + 3] = 255;
    } else {
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

// 压缩 raw（zlib deflate）
import zlib from "zlib";
const compressed = zlib.deflateSync(raw);

const png = Buffer.concat([
  sig,
  chunk("IHDR", ihdr),
  chunk("IDAT", compressed),
  chunk("IEND", Buffer.alloc(0)),
]);

writeFileSync("app-icon.png", png);
console.log("Generated app-icon.png (1024x1024)");
