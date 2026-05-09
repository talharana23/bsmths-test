// src/lib/storage.js
import fs from 'fs';
import path from 'path';

const IS_VERCEL = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const DEFAULT_ADMIN = { id: 'admin', name: 'Administrator', password: 'admin123' };

// ── Local file-system helpers (dev) ─────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), 'data');

function initLocalStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const defaults = {
    'students.json': [],
    'tests.json':    [],
    'results.json':  [],
    'admin.json':    DEFAULT_ADMIN,
  };

  for (const [file, def] of Object.entries(defaults)) {
    const fp = path.join(DATA_DIR, file);
    if (!fs.existsSync(fp)) fs.writeFileSync(fp, JSON.stringify(def, null, 2));
  }

  // Seed students from data.json if empty
  const studentsPath = path.join(DATA_DIR, 'students.json');
  try {
    const current = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
    if (Array.isArray(current) && current.length === 0) {
      const seedPath = path.join(process.cwd(), 'data.json');
      if (fs.existsSync(seedPath)) {
        const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
        if (Array.isArray(seed) && seed.length > 0) {
          const students = seed.map(s => ({
            id:       s.roll_no?.toString() || s.id?.toString(),
            name:     s.name || `Student ${s.roll_no || s.id}`,
            password: s.cnic?.toString() || s.password?.toString() || '123456',
            disabled: false,
          })).filter(s => s.id);
          fs.writeFileSync(studentsPath, JSON.stringify(students, null, 2));
        }
      }
    }
  } catch { /* skip */ }
}

function localGet(key) {
  const fp = path.join(DATA_DIR, `${key}.json`);
  if (!fs.existsSync(fp)) return key === 'admin' ? DEFAULT_ADMIN : [];
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function localSet(key, data) {
  const fp = path.join(DATA_DIR, `${key}.json`);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
}

// ── Upstash Redis helpers (production) ──────────────────────────────────────
let _redis = null;

async function getRedis() {
  if (_redis) return _redis;
  const { Redis } = await import('@upstash/redis');
  _redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return _redis;
}

async function redisGet(key) {
  const redis = await getRedis();
  return await redis.get(key);
}

async function redisSet(key, data) {
  const redis = await getRedis();
  await redis.set(key, data);
}

async function seedRedisStudentsIfEmpty() {
  const students = await redisGet('students');
  if (!students || students.length === 0) {
    try {
      const seedPath = path.join(process.cwd(), 'data.json');
      if (fs.existsSync(seedPath)) {
        const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
        if (Array.isArray(seed) && seed.length > 0) {
          const mapped = seed.map(s => ({
            id:       s.roll_no?.toString() || s.id?.toString(),
            name:     s.name || `Student ${s.roll_no || s.id}`,
            password: s.cnic?.toString() || s.password?.toString() || '123456',
            disabled: false,
          })).filter(s => s.id);
          await redisSet('students', mapped);
        }
      }
    } catch { /* skip */ }
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
if (!IS_VERCEL) initLocalStorage();

// ── Public API ───────────────────────────────────────────────────────────────
export async function getData(key) {
  if (!IS_VERCEL) {
    return localGet(key);
  }

  if (key === 'admin') {
    const admin = await redisGet('admin');
    if (!admin) {
      await redisSet('admin', DEFAULT_ADMIN);
      return DEFAULT_ADMIN;
    }
    return admin;
  }

  if (key === 'students') {
    await seedRedisStudentsIfEmpty();
    return (await redisGet('students')) || [];
  }

  return (await redisGet(key)) || [];
}

export async function saveData(key, data) {
  if (!IS_VERCEL) {
    localSet(key, data);
    return;
  }
  await redisSet(key, data);
}