import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, parseCurrencyInput, calculateInvoiceTotals } from './currency.ts';

test('formatCurrency formats valid numbers properly with symbol', () => {
  const resultUSD = formatCurrency(1500, 'USD');
  assert.ok(resultUSD.includes('1,500.00') || resultUSD.includes('1500'));
  assert.ok(resultUSD.includes('US$'));

  const resultARS = formatCurrency(250000.5, 'ARS');
  assert.ok(resultARS.includes('$'));
});

test('parseCurrencyInput accurately parses formatted monetary strings', () => {
  assert.equal(parseCurrencyInput('$ 1.250.000,50'), 1250000.5);
  assert.equal(parseCurrencyInput('1,250.75'), 1250.75);
  assert.equal(parseCurrencyInput(450.2), 450.2);
  assert.equal(parseCurrencyInput('invalid'), 0);
  assert.equal(parseCurrencyInput(''), 0);
});

test('calculateInvoiceTotals calculates sum of surgeon fees, materials, and taxes', () => {
  const totals = calculateInvoiceTotals(1000, 200, 300, 10);
  assert.equal(totals.subtotalFees, 1200);
  assert.equal(totals.subtotalMaterials, 300);
  assert.equal(totals.taxAmount, 150);
  assert.equal(totals.total, 1650);
});
