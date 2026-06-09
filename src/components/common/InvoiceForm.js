import React, { useState, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateLineItem, calculateInvoiceSummary, formatCurrency, today } from '../../utils/helpers';
import { validators, validateForm } from '../../utils/validation';
import FormField, { ErrorSummary } from './FormField';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

const emptyLine = { itemId: '', qty: 1, rate: 0, discountPercent: 0, taxPercent: 18, unit: '' };

export default function InvoiceForm({ type = 'sales', onSave, onCancel, initialData }) {
  const { state } = useApp();
  const isSales = type === 'sales' || type === 'salesReturn';
  const isPurchase = type === 'purchase' || type === 'purchaseReturn';
  const isReturn = type === 'salesReturn' || type === 'purchaseReturn';
  const isChallan = type === 'challan';

  const parties = state.parties.filter(p =>
    isSales || isChallan ? (p.type === 'Customer' || p.type === 'Both') :
    (p.type === 'Supplier' || p.type === 'Both')
  );

  const [form, setForm] = useState(initialData || {
    date: today(),
    partyId: '',
    billNo: '',
    dueDate: '',
    paymentMode: 'Credit',
    narration: '',
    additionalCharges: 0,
    vehicleNo: '',
    driverName: '',
    againstInvoice: '',
  });

  const [lines, setLines] = useState(initialData?.items || [{ ...emptyLine }]);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);


  const selectedParty = state.parties.find(p => p.id === form.partyId);
  const isInterState = selectedParty && selectedParty.state !== state.company.state;

  const calculatedLines = useMemo(() => lines.map(calculateLineItem), [lines]);
  const summary = useMemo(() => calculateInvoiceSummary(calculatedLines, isInterState), [calculatedLines, isInterState]);

  // ─── Header validation ───
  const headerErrors = useMemo(() => {
    const rules = {
      date: [validators.required(form.date, 'Date')],
      partyId: [validators.required(form.partyId, isSales || isChallan ? 'Customer' : 'Supplier')],
    };

    if (isPurchase && !isReturn) {
      rules.billNo = [validators.required(form.billNo, 'Supplier bill no')];
      if (form.dueDate && form.date) {
        rules.dueDate = [validators.dateAfter(form.dueDate, form.date, 'Due date', 'invoice date')];
      }
    }

    if (isReturn) {
      rules.againstInvoice = [validators.required(form.againstInvoice, 'Against Invoice/Bill reference')];
    }

    if (isChallan) {
      rules.vehicleNo = [validators.vehicleNo(form.vehicleNo)];
    }

    if (form.narration) {
      rules.narration = [validators.maxLength(form.narration, 500, 'Narration')];
    }

    if (isPurchase) {
      rules.additionalCharges = [validators.positiveNumber(form.additionalCharges, 'Additional charges')];
    }

    const { errors } = validateForm(rules);
    return errors;
  }, [form, isSales, isPurchase, isReturn, isChallan]);

  // ─── Line item validation ───
  const validatedLines = useMemo(() => {
    const validItems = calculatedLines.filter(l => l.itemId);
    if (validItems.length === 0) return [];

    return calculatedLines.map((line, idx) => {
      if (!line.itemId) return { errors: {} };
      const item = state.items.find(i => i.id === line.itemId);
      const errs = {};

      // Duplicate item check
      const dupIndex = calculatedLines.findIndex((l, i) => i !== idx && l.itemId === line.itemId);
      if (dupIndex !== -1) {
        errs.itemId = `Duplicate item (also in row ${dupIndex + 1})`;
      }

      // Qty validation
      if (!line.qty || Number(line.qty) <= 0) {
        errs.qty = 'Qty must be > 0';
      } else if (Number(line.qty) > 999999) {
        errs.qty = 'Qty too large';
      }

      // Stock check for sales/challan
      if ((isSales || isChallan) && !isReturn && item) {
        if (Number(line.qty) > item.currentStock) {
          errs.qty = `Insufficient stock (available: ${item.currentStock})`;
        }
      }

      // Rate validation
      if (Number(line.rate) <= 0) {
        errs.rate = 'Rate must be > 0';
      }

      // Discount range
      if (Number(line.discountPercent) < 0 || Number(line.discountPercent) > 100) {
        errs.discountPercent = '0-100%';
      }

      return { errors: errs };
    });
  }, [calculatedLines, state.items, isSales, isChallan, isReturn]);

  const hasLineErrors = validatedLines.some(l => Object.keys(l.errors).length > 0);
  const validItemCount = calculatedLines.filter(l => l.itemId).length;
  const hasHeaderErrors = Object.values(headerErrors).some(e => e);
  const noItemsError = validItemCount === 0;
  const hasAnyErrors = hasHeaderErrors || hasLineErrors || noItemsError;

  const touch = (field) => setTouched(prev => ({ ...prev, [field]: true }));

  const addLine = () => setLines([...lines, { ...emptyLine }]);

  const removeLine = (idx) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = useCallback((idx, field, value) => {
    setLines(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'itemId') {
        const item = state.items.find(i => i.id === value);
        if (item) {
          updated[idx].rate = isSales || isChallan ? item.saleRate : item.purchaseRate;
          updated[idx].taxPercent = item.taxPercent;
          updated[idx].unit = item.unit;
          updated[idx].itemName = item.name;
        }
      }
      return updated;
    });
  }, [state.items, isSales, isChallan]);

  const handleSubmit = () => {
    setSubmitted(true);
    // Touch all header fields
    const allTouched = {};
    Object.keys(headerErrors).forEach(k => { allTouched[k] = true; });
    allTouched.partyId = true;
    allTouched.date = true;
    setTouched(allTouched);

    if (hasAnyErrors) return;

    const data = {
      ...form,
      items: calculatedLines.filter(l => l.itemId),
      ...summary,
      isInterState,
    };
    onSave(data);
  };

  // Cash/bank balance check warning
  const paymentWarning = useMemo(() => {
    if (form.paymentMode === 'Credit') return '';
    if (isPurchase && !isReturn) {
      const accountName = form.paymentMode === 'Cash' ? 'Cash' : 'HDFC Bank - Current';
      const account = state.accounts.find(a => a.name === accountName);
      if (account && summary.grandTotal > account.balance) {
        return `Warning: ${accountName} balance (${formatCurrency(account.balance)}) is less than invoice total (${formatCurrency(summary.grandTotal)})`;
      }
    }
    return '';
  }, [form.paymentMode, isPurchase, isReturn, state.accounts, summary.grandTotal]);

  return (
    <div className="space-y-6">
      {submitted && hasAnyErrors && (
        <ErrorSummary errors={{
          ...headerErrors,
          ...(noItemsError ? { items: 'Please add at least one item with valid details' } : {}),
          ...(hasLineErrors ? { lineItems: 'Some line items have validation errors (see below)' } : {}),
        }} show={true} />
      )}

      {/* Header Fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FormField label="Date" required error={headerErrors.date} touched={touched.date || submitted}>
          <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} onBlur={() => touch('date')} max={today()} />
        </FormField>

        <FormField label={isSales || isChallan ? 'Customer' : 'Supplier'} required error={headerErrors.partyId} touched={touched.partyId || submitted}>
          <select className="input" value={form.partyId} onChange={e => setForm({...form, partyId: e.target.value})} onBlur={() => touch('partyId')}>
            <option value="">-- Select --</option>
            {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>

        {isPurchase && !isReturn && (
          <FormField label="Bill No (Supplier)" required error={headerErrors.billNo} touched={touched.billNo || submitted}>
            <input className="input" value={form.billNo} onChange={e => setForm({...form, billNo: e.target.value})} onBlur={() => touch('billNo')} maxLength={50} placeholder="Supplier's bill number" />
          </FormField>
        )}

        {isReturn && (
          <FormField label="Against Invoice/Bill" required error={headerErrors.againstInvoice} touched={touched.againstInvoice || submitted}>
            <input className="input" value={form.againstInvoice} onChange={e => setForm({...form, againstInvoice: e.target.value})} onBlur={() => touch('againstInvoice')} placeholder="Original invoice/bill number" />
          </FormField>
        )}

        <FormField label="Payment Mode" required>
          <select className="input" value={form.paymentMode} onChange={e => setForm({...form, paymentMode: e.target.value})}>
            <option>Credit</option>
            <option>Cash</option>
            <option>Bank</option>
          </select>
        </FormField>

        {isPurchase && !isReturn && (
          <FormField label="Due Date" error={headerErrors.dueDate} touched={touched.dueDate || submitted} hint="Must be on or after invoice date">
            <input className="input" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} onBlur={() => touch('dueDate')} min={form.date} />
          </FormField>
        )}

        {isChallan && (
          <>
            <FormField label="Vehicle No" error={headerErrors.vehicleNo} touched={touched.vehicleNo || submitted} hint="e.g. MH12AB1234">
              <input className="input" value={form.vehicleNo} onChange={e => setForm({...form, vehicleNo: e.target.value.toUpperCase()})} onBlur={() => touch('vehicleNo')} maxLength={15} style={{ textTransform: 'uppercase' }} />
            </FormField>
            <FormField label="Driver Name">
              <input className="input" value={form.driverName} onChange={e => setForm({...form, driverName: e.target.value})} maxLength={100} />
            </FormField>
          </>
        )}
      </div>

      {/* Warnings */}
      {selectedParty && isInterState && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 flex items-center gap-2">
          <AlertTriangle size={16} />
          Inter-state supply detected ({state.company.state} &rarr; {selectedParty.state}). IGST will be applied.
        </div>
      )}

      {paymentWarning && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-800 flex items-center gap-2">
          <AlertTriangle size={16} />
          {paymentWarning}
        </div>
      )}

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Line Items
            {submitted && noItemsError && <span className="text-red-500 ml-2 font-normal text-xs">- At least one item is required</span>}
          </h3>
          <button onClick={addLine} className="btn btn-sm btn-secondary flex items-center gap-1">
            <Plus size={14} /> Add Row
          </button>
        </div>
        <div className="table-container">
          <table className="table text-xs">
            <thead>
              <tr>
                <th style={{width: '30px'}}>#</th>
                <th style={{minWidth: '200px'}}>Item *</th>
                <th style={{width: '80px'}}>Qty *</th>
                <th style={{width: '60px'}}>Unit</th>
                <th style={{width: '100px'}}>Rate *</th>
                <th style={{width: '70px'}}>Disc%</th>
                <th style={{width: '100px'}}>Taxable</th>
                <th style={{width: '60px'}}>Tax%</th>
                <th style={{width: '90px'}}>Tax Amt</th>
                <th style={{width: '110px'}}>Net Amt</th>
                <th style={{width: '40px'}}></th>
              </tr>
            </thead>
            <tbody>
              {calculatedLines.map((line, idx) => {
                const le = validatedLines[idx]?.errors || {};
                const showLineErr = submitted;
                const item = state.items.find(i => i.id === line.itemId);
                return (
                  <tr key={idx} className={showLineErr && Object.keys(le).length > 0 ? '!bg-red-50' : ''}>
                    <td>{idx + 1}</td>
                    <td>
                      <select
                        className={`input !py-1 !text-xs ${showLineErr && le.itemId ? '!border-red-400' : ''}`}
                        value={line.itemId}
                        onChange={e => updateLine(idx, 'itemId', e.target.value)}
                      >
                        <option value="">-- Select Item --</option>
                        {state.items.map(i => (
                          <option key={i.id} value={i.id}>
                            {i.name} {(isSales || isChallan) && !isReturn ? `[Stock: ${i.currentStock}]` : ''}
                          </option>
                        ))}
                      </select>
                      {showLineErr && le.itemId && <p className="text-red-500 text-[10px] mt-0.5">{le.itemId}</p>}
                    </td>
                    <td>
                      <input
                        className={`input !py-1 !text-xs text-right ${showLineErr && le.qty ? '!border-red-400' : ''}`}
                        type="number"
                        min="1"
                        max={item && (isSales || isChallan) && !isReturn ? item.currentStock : 999999}
                        value={line.qty}
                        onChange={e => updateLine(idx, 'qty', Number(e.target.value))}
                      />
                      {showLineErr && le.qty && <p className="text-red-500 text-[10px] mt-0.5">{le.qty}</p>}
                    </td>
                    <td className="text-gray-500">{line.unit || '-'}</td>
                    <td>
                      <input
                        className={`input !py-1 !text-xs text-right ${showLineErr && le.rate ? '!border-red-400' : ''}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={line.rate}
                        onChange={e => updateLine(idx, 'rate', Number(e.target.value))}
                      />
                      {showLineErr && le.rate && <p className="text-red-500 text-[10px] mt-0.5">{le.rate}</p>}
                    </td>
                    <td>
                      <input
                        className={`input !py-1 !text-xs text-right ${showLineErr && le.discountPercent ? '!border-red-400' : ''}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={line.discountPercent}
                        onChange={e => updateLine(idx, 'discountPercent', Number(e.target.value))}
                      />
                    </td>
                    <td className="text-right">{formatCurrency(line.taxableAmount)}</td>
                    <td>
                      <select className="input !py-1 !text-xs" value={line.taxPercent} onChange={e => updateLine(idx, 'taxPercent', Number(e.target.value))}>
                        {state.taxes.map(t => <option key={t.id} value={t.rate}>{t.rate}%</option>)}
                      </select>
                    </td>
                    <td className="text-right">{formatCurrency(line.taxAmount)}</td>
                    <td className="text-right font-medium">{formatCurrency(line.netAmount)}</td>
                    <td>
                      <button onClick={() => removeLine(idx)} disabled={lines.length <= 1} className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex justify-between items-start">
        <div className="flex-1 mr-8">
          <FormField label="Narration" error={headerErrors.narration} touched={touched.narration || submitted}>
            <textarea className="input" rows={3} value={form.narration} onChange={e => setForm({...form, narration: e.target.value})} onBlur={() => touch('narration')} maxLength={500} placeholder="Notes..." />
          </FormField>
          {isPurchase && (
            <div className="mt-3">
              <FormField label="Additional Charges (Freight, Labour, etc.)" error={headerErrors.additionalCharges} touched={touched.additionalCharges || submitted}>
                <input className="input max-w-xs" type="number" min="0" step="0.01" value={form.additionalCharges} onChange={e => setForm({...form, additionalCharges: Number(e.target.value)})} onBlur={() => touch('additionalCharges')} />
              </FormField>
            </div>
          )}
        </div>
        <div className="w-72 bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span>{formatCurrency(summary.subtotal)}</span></div>
          {summary.totalDiscount > 0 && (
            <div className="flex justify-between"><span className="text-gray-600">Discount:</span><span className="text-red-600">-{formatCurrency(summary.totalDiscount)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-gray-600">Taxable:</span><span>{formatCurrency(summary.taxable)}</span></div>
          {isInterState ? (
            <div className="flex justify-between"><span className="text-gray-600">IGST:</span><span>{formatCurrency(summary.igst)}</span></div>
          ) : (
            <>
              <div className="flex justify-between"><span className="text-gray-600">CGST:</span><span>{formatCurrency(summary.cgst)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">SGST:</span><span>{formatCurrency(summary.sgst)}</span></div>
            </>
          )}
          {summary.roundOff !== 0 && (
            <div className="flex justify-between"><span className="text-gray-600">Round Off:</span><span>{formatCurrency(summary.roundOff)}</span></div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-300 font-bold text-base">
            <span>Grand Total:</span>
            <span>{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button onClick={handleSubmit} className="btn btn-primary" disabled={submitted && hasAnyErrors}>Save</button>
      </div>
    </div>
  );
}
