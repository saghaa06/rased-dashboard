// Simple Algerian plate parser used across the dashboard.
// Expected output shape:
// { wilaya: string | null, typeLabel: string | null }

export function parseAlgerianPlate(input) {
  const value = (input ?? '').toString().trim();
  if (!value) return { wilaya: null, typeLabel: null };

  // Heuristic: wilaya is the first 1-3 digits of the plate (if present)
  const digits = value.match(/\d{1,3}/);
  const wilaya = digits ? digits[0] : null;

  // Heuristic: vehicle type label based on common plate patterns
  let typeLabel = null;
  if (/\bCD\b/i.test(value) || /CD/i.test(value)) typeLabel = 'Diplomatique';
  else if (/\bC\b/i.test(value)) typeLabel = 'Commercial';
  else if (/\bVP\b/i.test(value) || /VP/i.test(value)) typeLabel = 'Véhicule particulier';

  return { wilaya, typeLabel };
}

export function formatPlateDetails(plateInfo) {
  if (!plateInfo) return '—';

  const wilaya = plateInfo.wilaya ?? null;
  const typeLabel = plateInfo.typeLabel ?? null;

  const parts = [
    wilaya ? `Wilaya: ${wilaya}` : null,
    typeLabel ? `Type: ${typeLabel}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(' • ') : '—';
}

