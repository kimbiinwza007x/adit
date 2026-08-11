// จุดเข้าของ Vercel Serverless Function
//
// ชื่อไฟล์เป็น optional catch-all เพื่อให้ทุก path ใต้ /api วิ่งเข้ามาที่นี่
// (/api, /api/health, /api/rewrite) โดยไม่ต้องพึ่ง rewrite ซึ่งอาจเปลี่ยน req.url
//
// ไฟล์นี้เป็น .js และ require จาก dist/ ที่ nest build คอมไพล์ไว้แล้ว
// เพราะ NestJS ต้องการ emitDecoratorMetadata ซึ่ง bundler ของ Vercel ไม่ได้เปิดให้
const { getServer } = require('../dist/serverless');

module.exports = async function handler(req, res) {
  const server = await getServer();
  server(req, res);
};
