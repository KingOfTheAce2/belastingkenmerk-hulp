/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParsedAanslagnummer {
  raw: string;
  bsnRsin: string;
  middel: string;
  javo: string;
}

export function parseAanslagnummer(raw: string): ParsedAanslagnummer {
  // Remove dots and other non-alphanumeric characters
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length !== 17 && clean.length !== 16) {
    throw new Error('Aanslagnummer moet 16 of 17 tekens lang zijn (bijv. 0000.00.000.V.00.0000).');
  }

  return {
    raw: clean,
    bsnRsin: clean.slice(0, 9),
    middel: clean.slice(9, 10),
    javo: clean.slice(10), // Take the rest as JAVO (6 or 7 chars)
  };
}

export function calculateMod11ControlDigit(body15: string): number {
  if (body15.length !== 15) {
    throw new Error('Body voor controlecijfer moet 15 cijfers zijn.');
  }

  let sum = 0;
  // Weights for pos 2 to 16 are 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
  for (let i = 0; i < 15; i++) {
    const digit = parseInt(body15[i], 10);
    const weight = i + 2;
    sum += digit * weight;
  }

  const remainder = sum % 11;
  const control = (11 - remainder) % 11;

  if (control === 10) {
    throw new Error('Dit aanslagnummer resulteert in een ongeldig betalingskenmerk (controlecijfer 10).');
  }

  return control;
}

function convertV(a: ParsedAanslagnummer): string {
  // pos 2-7: pos 3-8 van A-BSN/RSIN
  const bsnRsinPart = a.bsnRsin.slice(2, 8);
  
  // Normalize JAVO to 7 chars by padding with a leading zero if it's 6 chars
  const javo7 = a.javo.length === 6 ? '0' + a.javo : a.javo;

  // pos 8: JAAR (pos 2 van JAVO)
  const jaar = javo7.slice(1, 2);
  // pos 9: SOORT (pos 3 van JAVO)
  const soort = javo7.slice(2, 3);
  // pos 10-11: B-MIDDEL
  const rsinPrefix = a.bsnRsin.slice(0, 2);
  let bMiddel = '';
  if (rsinPrefix === '00') {
    bMiddel = '74';
  } else {
    const prefixNum = parseInt(rsinPrefix, 10);
    if (prefixNum >= 80 && prefixNum <= 84) {
      bMiddel = rsinPrefix;
    } else if (prefixNum >= 85 && prefixNum <= 89) {
      bMiddel = (prefixNum + 7).toString();
    } else {
      throw new Error(`Onbekende RSIN prefix voor V: ${rsinPrefix}`);
    }
  }
  // pos 12-15: TYDVAK (pos 4-7 van JAVO)
  const tydvak = javo7.slice(3, 7);
  // pos 16: MIDHERK (0)
  const midherk = '0';

  return bsnRsinPart + jaar + soort + bMiddel + tydvak + midherk;
}

function convertABFL(a: ParsedAanslagnummer): string {
  // Normalize JAVO to 7 chars
  const javo7 = a.javo.length === 6 ? '0' + a.javo : a.javo;

  // pos 2-9: pos 1-8 van A-BSN/RSIN
  const bsnRsinPart = a.bsnRsin.slice(0, 8);
  // pos 10: B-MIDDEL (0=A, 1=B, 5=F, 6=L)
  const middelMap: Record<string, string> = { A: '0', B: '1', F: '5', L: '6' };
  const bMiddel = middelMap[a.middel];
  // pos 11: JAAR (pos 4 van JAVO)
  const jaar = javo7.slice(3, 4);
  // pos 12-13: SUBNO (pos 1-2 van JAVO)
  const subno = javo7.slice(0, 2);
  // pos 14-15: TYDVAK (pos 5-6 van JAVO)
  const tydvak = javo7.slice(4, 6);
  // pos 16: VOLGLBOB (pos 7 van JAVO)
  const volg = javo7.slice(6, 7);

  return bsnRsinPart + bMiddel + jaar + subno + tydvak + volg;
}

function convertHNW(a: ParsedAanslagnummer): string {
  // Normalize JAVO to 7 chars
  const javo7 = a.javo.length === 6 ? '0' + a.javo : a.javo;

  // pos 2-9: pos 1-8 van A-BSN/RSIN
  const bsnRsinPart = a.bsnRsin.slice(0, 8);
  // pos 10-11: B-MIDDEL (70=H, 73=N, 75=W)
  const middelMap: Record<string, string> = { H: '70', N: '73', W: '75' };
  const bMiddel = middelMap[a.middel];
  // pos 12: JAAR (pos 2 van JAVO)
  const jaar = javo7.slice(1, 2);
  // pos 13: SOORT (pos 3 van JAVO)
  const soort = javo7.slice(2, 3);
  // pos 14: 0
  const zero = '0';
  // pos 15-16: VOLGNUMMER (pos 5-6 van JAVO)
  let volg = javo7.slice(4, 6);
  // Voor W is pos 16 A-MIDHERK (pos 7 van JAVO)
  if (a.middel === 'W') {
    volg = javo7.slice(4, 5) + javo7.slice(6, 7);
  }

  return bsnRsinPart + bMiddel + jaar + soort + zero + volg;
}

export function convertToBetalingskenmerk(a: ParsedAanslagnummer): string {
  let body15 = '';
  if (a.middel === 'V') {
    body15 = convertV(a);
  } else if (['A', 'B', 'F', 'L'].includes(a.middel)) {
    body15 = convertABFL(a);
  } else if (['H', 'N', 'W'].includes(a.middel)) {
    body15 = convertHNW(a);
  } else {
    throw new Error(`Middel '${a.middel}' wordt momenteel niet ondersteund door deze tool.`);
  }

  const control = calculateMod11ControlDigit(body15);
  return control.toString() + body15;
}

export function formatBetalingskenmerk(kenmerk: string): string {
  return kenmerk.replace(/(.{4})/g, '$1 ').trim();
}
