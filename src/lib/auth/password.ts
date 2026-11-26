import crypto from "crypto";

if (typeof window !== "undefined") {
  throw new Error("auth/password is server-only");
}

export function hashPassword(password: string): string {
  const saltHex = crypto.randomBytes(16).toString("hex");
  const hashHex = crypto.scryptSync(password, saltHex, 64).toString("hex");
  return `scrypt$${saltHex}$${hashHex}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }
  const [, saltHex, expectedHex] = parts;
  if (!saltHex || !expectedHex) {
    return false;
  }
  try {
    const derived = crypto.scryptSync(password, saltHex, 64);
    const expected = Buffer.from(expectedHex, "hex");
    if (derived.length !== expected.length) {
      return false;
    }
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function evaluatePasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  let score = 0;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const clamped = Math.min(4, Math.max(0, score)) as 0 | 1 | 2 | 3 | 4;
  const labels: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: "Too short",
    1: "Weak",
    2: "Fair",
    3: "Strong",
    4: "Very Strong",
  };
  return { score: clamped, label: labels[clamped] };
}
