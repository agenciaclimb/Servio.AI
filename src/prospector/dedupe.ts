export type ProspectMinimal = {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
};

function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  // remove leading country code variations like 55, +55, 1, etc., keep last 10-11 digits
  const trimmed = digits.length > 11 ? digits.slice(-11) : digits;
  return trimmed || null;
}

function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

function normalizeName(name?: string | null): string | null {
  if (!name) return null;
  return name.trim().toLowerCase().replace(/[\s]+/g, ' ');
}

export function fingerprint(p: ProspectMinimal): string {
  const email = normalizeEmail(p.email) || '';
  const phone = normalizePhone(p.phone) || '';
  const name = normalizeName(p.name) || '';
  const company = (p.company || '').trim().toLowerCase();
  const key = [email, phone, name, company].filter(Boolean).join('|');
  // simple hash
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h << 5) - h + key.charCodeAt(i);
    h |= 0; // force 32-bit
  }
  return `fp_${Math.abs(h)}`;
}

export function isDuplicate(a: ProspectMinimal, b: ProspectMinimal): boolean {
  // Strong match by email or phone
  const emailMatch = !!normalizeEmail(a.email) && normalizeEmail(a.email) === normalizeEmail(b.email);
  const phoneMatch = !!normalizePhone(a.phone) && normalizePhone(a.phone) === normalizePhone(b.phone);
  if (emailMatch || phoneMatch) return true;
  // Soft match by name + company
  const nameCompanyMatch = !!normalizeName(a.name) && !!(a.company && b.company) && normalizeName(a.name) === normalizeName(b.name) && a.company!.trim().toLowerCase() === b.company!.trim().toLowerCase();
  return !!nameCompanyMatch;
}

export function filterDuplicates(existing: ProspectMinimal[], incoming: ProspectMinimal[]): { unique: ProspectMinimal[]; dupes: ProspectMinimal[] } {
  const index = new Map<string, ProspectMinimal>();
  for (const e of existing) {
    index.set(fingerprint(e), e);
  }
  const unique: ProspectMinimal[] = [];
  const dupes: ProspectMinimal[] = [];
  for (const inc of incoming) {
    const fp = fingerprint(inc);
    if (index.has(fp)) {
      dupes.push(inc);
    } else {
      unique.push(inc);
    }
  }
  return { unique, dupes };
}
