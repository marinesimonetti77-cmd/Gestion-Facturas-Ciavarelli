/**
 * Currency and financial calculation utilities for surgical billing
 */

export type CurrencyCode = 'USD' | 'ARS' | 'EUR' | 'MXN' | 'COP';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  exchangeRateToUSD: number; // For multi-currency estimation
}

export const CURRENCY_MAP: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: 'US$', locale: 'en-US', exchangeRateToUSD: 1.0 },
  ARS: { code: 'ARS', symbol: '$', locale: 'es-AR', exchangeRateToUSD: 1250.0 },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', exchangeRateToUSD: 0.92 },
  MXN: { code: 'MXN', symbol: 'Mex$', locale: 'es-MX', exchangeRateToUSD: 19.5 },
  COP: { code: 'COP', symbol: 'COL$', locale: 'es-CO', exchangeRateToUSD: 4100.0 },
};

/**
 * Formats a monetary number into a localized string with proper symbol
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'ARS',
  includeSymbol: boolean = true
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return includeSymbol ? `${CURRENCY_MAP[currency]?.symbol || '$'} 0,00` : '0,00';
  }

  const config = CURRENCY_MAP[currency] || CURRENCY_MAP.ARS;

  try {
    const formatted = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return includeSymbol ? `${config.symbol} ${formatted}` : formatted;
  } catch {
    return includeSymbol ? `${config.symbol} ${amount.toFixed(2)}` : amount.toFixed(2);
  }
}

/**
 * Parses user input into a clean numeric amount
 */
export function parseCurrencyInput(value: string | number): number {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  if (!value) return 0;

  // Clean strings like "$ 1.250.000,50" or "1,250.50"
  let clean = value.replace(/[^0-9.,-]/g, '').trim();

  // If both . and , are present, determine decimal separator
  const lastDot = clean.lastIndexOf('.');
  const lastComma = clean.lastIndexOf(',');

  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) {
      // European/LatAm style: 1.250,50 -> 1250.50
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // US style: 1,250.50 -> 1250.50
      clean = clean.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    // Only comma present: if 2 digits after comma, it's decimal, else thousand separator
    const parts = clean.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      clean = clean.replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Calculates invoice breakdown
 */
export function calculateInvoiceTotals(
  surgeonFee: number,
  assistantFee: number = 0,
  materialsCost: number = 0,
  taxRate: number = 0
): {
  subtotalFees: number;
  subtotalMaterials: number;
  taxAmount: number;
  total: number;
} {
  const safeSurgeon = isNaN(surgeonFee) ? 0 : surgeonFee;
  const safeAssistant = isNaN(assistantFee) ? 0 : assistantFee;
  const safeMaterials = isNaN(materialsCost) ? 0 : materialsCost;
  const safeTax = isNaN(taxRate) ? 0 : taxRate;

  const subtotalFees = safeSurgeon + safeAssistant;
  const subtotalMaterials = safeMaterials;
  const base = subtotalFees + subtotalMaterials;
  const taxAmount = Math.round(base * (safeTax / 100) * 100) / 100;
  const total = Math.round((base + taxAmount) * 100) / 100;

  return {
    subtotalFees,
    subtotalMaterials,
    taxAmount,
    total,
  };
}
