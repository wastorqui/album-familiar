import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { seedState } from "./seed";
import { COLLECTIONS, type State } from "./types";

// Almacenamiento: Upstash Redis en Vercel; un fichero local (data/dev-db.json) para pruebas en el ordenador.

const P = "album";
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

export const usingRedis = !!redis;

// ---------- Fichero local (solo desarrollo) ----------
const FILE = path.join(process.cwd(), "data", "dev-db.json");
let fileLock: Promise<unknown> = Promise.resolve();
async function readFile(): Promise<State> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    const s = seedState();
    await writeFile(s);
    return s;
  }
}
async function writeFile(s: State) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(s, null, 1));
}

// ---------- API ----------
export async function loadState(): Promise<State> {
  if (!redis && process.env.VERCEL) throw new Error("Falta conectar la base de datos (Upstash Redis) en Vercel");
  if (!redis) return readFile();
  const pipe = redis.pipeline();
  pipe.get(`${P}:settings`);
  for (const c of COLLECTIONS) pipe.hgetall(`${P}:${c}`);
  const [settings, ...colls] = (await pipe.exec()) as any[];
  if (!settings) return seedRedis();
  const s: any = { settings };
  COLLECTIONS.forEach((c, i) => (s[c] = colls[i] || {}));
  return s as State;
}

async function seedRedis(): Promise<State> {
  const seed = seedState();
  const ok = await redis!.set(`${P}:settings`, seed.settings, { nx: true });
  if (!ok) return loadState(); // otro proceso ya lo ha sembrado
  const pipe = redis!.pipeline();
  for (const c of COLLECTIONS) {
    const rec = seed[c] as Record<string, unknown>;
    if (Object.keys(rec).length) pipe.hset(`${P}:${c}`, rec);
  }
  await pipe.exec();
  return seed;
}

/** Guarda solo lo que ha cambiado entre dos estados (así dos personas a la vez no se pisan). */
export async function saveDiff(prev: State, next: State): Promise<void> {
  if (!redis) {
    // en local se serializa con un candado simple
    const run = fileLock.then(async () => {
      const cur = await readFile();
      const merged = mergeDiff(cur, prev, next);
      await writeFile(merged);
    });
    fileLock = run.catch(() => {});
    return run;
  }
  const pipe = redis.pipeline();
  let n = 0;
  if (JSON.stringify(prev.settings) !== JSON.stringify(next.settings)) {
    pipe.set(`${P}:settings`, next.settings);
    n++;
  }
  for (const c of COLLECTIONS) {
    const a = prev[c] as Record<string, unknown>;
    const b = next[c] as Record<string, unknown>;
    const changed: Record<string, unknown> = {};
    for (const id of Object.keys(b)) if (JSON.stringify(a[id]) !== JSON.stringify(b[id])) changed[id] = b[id];
    const removed = Object.keys(a).filter((id) => !(id in b));
    if (Object.keys(changed).length) { pipe.hset(`${P}:${c}`, changed); n++; }
    if (removed.length) { pipe.hdel(`${P}:${c}`, ...removed); n++; }
  }
  if (n) await pipe.exec();
}

function mergeDiff(cur: State, prev: State, next: State): State {
  const out: any = { ...cur };
  if (JSON.stringify(prev.settings) !== JSON.stringify(next.settings)) out.settings = next.settings;
  for (const c of COLLECTIONS) {
    const a = prev[c] as any, b = next[c] as any, o = { ...(cur[c] as any) };
    for (const id of Object.keys(b)) if (JSON.stringify(a[id]) !== JSON.stringify(b[id])) o[id] = b[id];
    for (const id of Object.keys(a)) if (!(id in b)) delete o[id];
    out[c] = o;
  }
  return out;
}

// ---------- Freno a intentos de PIN ----------
const memFails = new Map<string, { n: number; until: number }>();
const MAX = 8, WINDOW = 15 * 60;

export async function isLocked(ip: string): Promise<boolean> {
  if (!redis) { const f = memFails.get(ip); return !!f && f.n >= MAX && f.until > Date.now(); }
  const n = Number((await redis.get(`${P}:fails:${ip}`)) || 0);
  return n >= MAX;
}
export async function registerFail(ip: string) {
  if (!redis) {
    const f = memFails.get(ip);
    const until = Date.now() + WINDOW * 1000;
    memFails.set(ip, { n: f && f.until > Date.now() ? f.n + 1 : 1, until });
    return;
  }
  const k = `${P}:fails:${ip}`;
  const n = await redis.incr(k);
  if (n === 1) await redis.expire(k, WINDOW);
}
export async function clearFails(ip: string) {
  if (!redis) { memFails.delete(ip); return; }
  await redis.del(`${P}:fails:${ip}`);
}
