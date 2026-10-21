import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAge,
  getDaysDifference,
  getInvoiceUrgency,
  calculateFinancialMetrics,
  calculateSurgeryMetrics,
  validateSurgicalCase,
  validateInvoice,
  getCaseLiquidationStatus,
} from './surgicalLogic.ts';
import type { SurgicalCase, Invoice } from '../types/surgical.ts';

test('calculateAge correctly computes age based on birth date', () => {
  const refDate = new Date('2026-10-15T00:00:00');
  assert.equal(calculateAge('1990-10-10', refDate), 36);
  assert.equal(calculateAge('1990-10-20', refDate), 35);
  assert.equal(calculateAge('', refDate), 0);
});

test('getDaysDifference determines overdue and upcoming days accurately', () => {
  const refDateStr = '2026-10-15';
  assert.equal(getDaysDifference('2026-10-20', refDateStr), 5);
  assert.equal(getDaysDifference('2026-10-10', refDateStr), -5);
  assert.equal(getDaysDifference('2026-10-15', refDateStr), 0);
});

test('getInvoiceUrgency flags collected, overdue, and due-soon properly', () => {
  const refDateStr = '2026-10-15';
  assert.equal(getInvoiceUrgency('2026-10-10', 'EMITIDA', refDateStr), 'overdue');
  assert.equal(getInvoiceUrgency('2026-10-18', 'EMITIDA', refDateStr), 'due-soon');
  assert.equal(getInvoiceUrgency('2026-11-20', 'EMITIDA', refDateStr), 'normal');
  assert.equal(getInvoiceUrgency('2026-10-01', 'COBRADA', refDateStr), 'collected');
});

test('calculateFinancialMetrics accurately tallies billed, collected and pending', () => {
  const invoices: Invoice[] = [
    {
      id: 'inv-1',
      invoiceNumber: 'FAC-001',
      caseId: 'c1',
      patientName: 'Juan Pérez',
      patientMedicalRecordNumber: 'HC-101',
      insuranceProvider: 'OSDE',
      clinic: 'Clínica San Jerónimo',
      surgeonFee: 1000,
      materialsCost: 500,
      taxRate: 0,
      totalAmount: 1500,
      currency: 'USD',
      issueDate: '2026-10-01',
      expectedCollectionDate: '2026-10-10',
      status: 'COBRADA',
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    },
    {
      id: 'inv-2',
      invoiceNumber: 'FAC-002',
      caseId: 'c2',
      patientName: 'María Gomez',
      patientMedicalRecordNumber: 'HC-102',
      insuranceProvider: 'Swiss Medical',
      clinic: 'Hospital Italiano',
      surgeonFee: 2000,
      materialsCost: 500,
      taxRate: 0,
      totalAmount: 2500,
      currency: 'USD',
      issueDate: '2026-10-01',
      expectedCollectionDate: '2026-10-05',
      status: 'EMITIDA', // overdue
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01',
    },
  ];

  const metrics = calculateFinancialMetrics(invoices);
  assert.equal(metrics.totalBilled, 4000);
  assert.equal(metrics.totalCollected, 1500);
  assert.equal(metrics.totalPending, 2500);
  assert.equal(metrics.collectedCount, 1);
  assert.equal(metrics.collectionRate, 38);
});

test('validateSurgicalCase catches missing required fields', () => {
  const invalid = validateSurgicalCase({});
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.patientName);
  assert.ok(invalid.errors.patientMedicalRecordNumber);

  const valid = validateSurgicalCase({
    patientName: 'Ana Gomez',
    patientMedicalRecordNumber: 'HC-999',
    procedureName: 'Colecistectomía',
    surgeonName: 'Dr. Rossi',
    estimatedSurgeryClinic: 'Sanatorio Los Arcos',
    surgeryDate: '2026-11-01',
  });
  assert.equal(valid.isValid, true);
});

test('getCaseLiquidationStatus identifies 3-month overdue cases awaiting liquidation', () => {
  const overThreeMonthsCase: any = {
    id: 'case-test-1',
    status: 'REALIZADA',
    surgeryDate: '2026-07-03',
    invoiceId: undefined,
  };
  const status = getCaseLiquidationStatus(overThreeMonthsCase);
  assert.equal(status.stage, 'DUE_FOR_BILLING');
  assert.ok(status.daysSinceSurgery >= 90);
  assert.equal(status.isUrgent, true);

  const billedCase: any = {
    id: 'case-test-2',
    status: 'REALIZADA',
    surgeryDate: '2026-07-03',
    invoiceId: 'inv-123',
  };
  const billedStatus = getCaseLiquidationStatus(billedCase);
  assert.equal(billedStatus.stage, 'BILLED');

  const recentCase: any = {
    id: 'case-test-3',
    status: 'REALIZADA',
    surgeryDate: '2026-09-20',
    invoiceId: undefined,
  };
  const recentStatus = getCaseLiquidationStatus(recentCase);
  assert.equal(recentStatus.stage, 'IN_AUDIT');
});

