// Convertit récursivement les BigInt (ids Prisma) en string pour pouvoir
// renvoyer du JSON (JSON.stringify ne sait pas sérialiser un BigInt).
export function toJSON<T>(data: T): unknown {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
}
