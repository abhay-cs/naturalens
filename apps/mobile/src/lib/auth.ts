import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BannerTone } from '../components/Banner';

/**
 * Sign-in — email, then a six-digit code.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 *  STUB. There is no auth backend. Read `docs/DESIGN.md` §7 before trusting this.
 *
 *  The code is generated on this device, stored on this device, and compared on this
 *  device, so any address is accepted and nothing is emailed. That is a deliberate
 *  placeholder, not an oversight: the app has no server of its own (§2), and the
 *  Cloudflare worker in `apps/web` both lacks an auth route and — since it gained
 *  `isSameOrigin()` — rejects any request without an `Origin` or `Referer` header,
 *  which is every request React Native makes.
 *
 *  Three functions become network calls when a real endpoint lands, and only these
 *  three: `requestCode`, `verifyCode`, and the `PENDING_KEY` storage they share. The
 *  screens above them already handle latency and typed failures, so swapping the
 *  transport should not touch a single component.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

/** Versioned, like `naturalens-history-v1` — a schema change can migrate rather than misread. */
const SESSION_KEY = 'naturalens-session-v1';
const PENDING_KEY = 'naturalens-pending-code-v1';

/** How long a requested code stays good. */
const CODE_TTL_MS = 10 * 60 * 1000;

export const OTP_LENGTH = 6;

/**
 * The same test the landing page and the worker use
 * (`apps/web/src/components/sections/Waitlist.tsx`, `EMAIL_RE` in `apps/web/worker/index.ts`).
 * Copied rather than loosened so the two surfaces cannot disagree about what an address is —
 * an address the site accepts and the app rejects would be our bug reported as theirs.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The worker's limit. Longer than this is not an address, it's a paste accident. */
const EMAIL_MAX = 254;

export interface Session {
  email: string;
  signedInAt: number;
}

interface PendingCode {
  email: string;
  code: string;
  expiresAt: number;
}

/**
 * A failure whose `message` is the UI copy, with the tone riding along — the convention
 * `DetectorError` set in `lib/detector.ts` and `docs/DESIGN.md` §5a. The message is
 * rendered verbatim, so it has to read as a sentence someone wrote on purpose.
 */
export class AuthError extends Error {
  tone: BannerTone;

  constructor(message: string, tone: BannerTone = 'danger') {
    super(message);
    this.name = 'AuthError';
    this.tone = tone;
  }
}

/**
 * Returns the copy to show under the field, or `null` if the address is fine.
 *
 * A string rather than a thrown error because this one never leaves the screen — it is a
 * field-level correction, not a condition of the world, so it doesn't earn a banner.
 */
export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return 'Email is required.';
  if (email.length > EMAIL_MAX) return 'That address is too long.';
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address.';
  return null;
}

/** Trim and lowercase, as the worker does before it stores anything. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** STUB — stands in for the round trip a real `POST /api/auth/request-code` would take. */
function stubLatency(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends a code to `email`.
 *
 * Resolves with the code itself so the screen can offer it under `__DEV__` — without that
 * the flow is untestable on a device, since nothing is actually delivered. A real
 * implementation returns nothing, and the `__DEV__` block above it goes away with this one.
 */
export async function requestCode(email: string): Promise<string> {
  await stubLatency(700);

  const code = String(Math.floor(Math.random() * 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
  const pending: PendingCode = {
    email: normalizeEmail(email),
    code,
    expiresAt: Date.now() + CODE_TTL_MS,
  };

  try {
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    throw new AuthError("Couldn't start sign-in on this device. Try again.");
  }

  // The only place the code exists outside storage. Kept to `__DEV__` so a release build
  // doesn't print it, even though a release build shouldn't be running this file at all.
  if (__DEV__) console.log(`[auth stub] code for ${pending.email}: ${code}`);

  return code;
}

/** Checks `code` against the one we issued, and signs in on a match. */
export async function verifyCode(email: string, code: string): Promise<Session> {
  await stubLatency(600);

  let pending: PendingCode | null = null;
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    if (raw) pending = JSON.parse(raw) as PendingCode;
  } catch {
    pending = null;
  }

  if (!pending || pending.email !== normalizeEmail(email)) {
    throw new AuthError('That code has expired. Send a new one.', 'warning');
  }

  if (Date.now() > pending.expiresAt) {
    await AsyncStorage.removeItem(PENDING_KEY).catch(() => {});
    throw new AuthError('That code has expired. Send a new one.', 'warning');
  }

  if (pending.code !== code) {
    throw new AuthError("That code didn't match. Check it and try again.", 'warning');
  }

  const session: Session = { email: pending.email, signedInAt: Date.now() };

  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    await AsyncStorage.removeItem(PENDING_KEY);
  } catch {
    throw new AuthError("Couldn't finish signing in. Try again.");
  }

  return session;
}

/** A corrupt read starts clean rather than crashing at launch — same rule as `loadHistory`. */
export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Session;
    if (typeof parsed?.email !== 'string' || !parsed.email) return null;

    return { email: parsed.email, signedInAt: parsed.signedInAt ?? 0 };
  } catch {
    return null;
  }
}

/** Drops the session and any half-finished code with it. */
export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([SESSION_KEY, PENDING_KEY]);
}
