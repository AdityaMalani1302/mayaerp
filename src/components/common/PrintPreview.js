import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function PrintPreview({ type, data, onClose }) {
  const { state } = useApp();
  const co = state.company;
  const party = state.parties.find(p => p.id === data.partyId);

  const handlePrint = () => window.print();

  const fullAddress = [co.address, [co.city, co.state, co.pincode].filter(Boolean).join(', '), co.country].filter(Boolean).join('\n');

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <div className="no-print flex items-center gap-4 p-4 bg-gray-100 border-b sticky top-0">
        <button onClick={handlePrint} className="btn btn-primary">Print</button>
        <button onClick={onClose} className="btn btn-secondary">Close</button>
      </div>

      <div className="max-w-[210mm] mx-auto p-8 bg-white" id="print-area">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-center">{co.name}</h1>
          {co.legalName && co.legalName !== co.name && (
            <p className="text-center text-xs text-gray-500">({co.legalName})</p>
          )}
          <p className="text-center text-sm text-gray-600 whitespace-pre-line">{fullAddress}</p>
          <div className="flex justify-between text-xs text-gray-500 mt-2 flex-wrap gap-x-4">
            <span>GSTIN: {co.gstin}</span>
            {co.pan && <span>PAN: {co.pan}</span>}
            <span>Phone: {co.phone}{co.mobile ? ` / ${co.mobile}` : ''}</span>
            <span>Email: {co.email}</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center mb-6 uppercase">
          {type === 'invoice' ? 'Tax Invoice' : type === 'challan' ? 'Delivery Challan' : type === 'purchaseBill' ? 'Purchase Bill' : 'Document'}
        </h2>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
          <div>
            <h3 className="font-semibold mb-1">{type === 'purchaseBill' ? 'Supplier' : 'Bill To'}:</h3>
            <p className="font-medium">{party?.name}</p>
            <p className="text-gray-600">{party?.address}</p>
            {party?.gstin && <p className="text-gray-600">GSTIN: {party.gstin}</p>}
            {party?.phone && <p className="text-gray-600">Phone: {party.phone}</p>}
          </div>
          <div className="text-right">
            <p><span className="font-semibold">No:</span> {data.invoiceNo || data.challanNo || data.entryNo}</p>
            <p><span className="font-semibold">Date:</span> {formatDate(data.date)}</p>
            {data.dueDate && <p><span className="font-semibold">Due Date:</span> {formatDate(data.dueDate)}</p>}
            {data.vehicleNo && <p><span className="font-semibold">Vehicle:</span> {data.vehicleNo}</p>}
            {data.driverName && <p><span className="font-semibold">Driver:</span> {data.driverName}</p>}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse border border-gray-400 text-sm mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 px-2 py-1.5 text-left">#</th>
              <th className="border border-gray-400 px-2 py-1.5 text-left">Item</th>
              <th className="border border-gray-400 px-2 py-1.5 text-right">Qty</th>
              <th className="border border-gray-400 px-2 py-1.5 text-right">Rate</th>
              {type !== 'challan' && (
                <>
                  <th className="border border-gray-400 px-2 py-1.5 text-right">Disc%</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-right">Taxable</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-right">GST%</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-right">Tax</th>
                  <th className="border border-gray-400 px-2 py-1.5 text-right">Net</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.items?.map((item, i) => {
              const product = state.items.find(p => p.id === item.itemId);
              return (
                <tr key={i}>
                  <td className="border border-gray-400 px-2 py-1">{i + 1}</td>
                  <td className="border border-gray-400 px-2 py-1">{product?.name || item.itemName}</td>
                  <td className="border border-gray-400 px-2 py-1 text-right">{item.qty} {product?.unit}</td>
                  <td className="border border-gray-400 px-2 py-1 text-right">{formatCurrency(item.rate)}</td>
                  {type !== 'challan' && (
                    <>
                      <td className="border border-gray-400 px-2 py-1 text-right">{item.discountPercent || 0}%</td>
                      <td className="border border-gray-400 px-2 py-1 text-right">{formatCurrency(item.taxableAmount)}</td>
                      <td className="border border-gray-400 px-2 py-1 text-right">{item.taxPercent}%</td>
                      <td className="border border-gray-400 px-2 py-1 text-right">{formatCurrency(item.taxAmount)}</td>
                      <td className="border border-gray-400 px-2 py-1 text-right">{formatCurrency(item.netAmount)}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary */}
        {type !== 'challan' && (
          <div className="flex justify-end">
            <div className="w-72 text-sm">
              <div className="flex justify-between py-1"><span>Subtotal:</span><span>{formatCurrency(data.subtotal)}</span></div>
              {data.totalDiscount > 0 && (
                <div className="flex justify-between py-1"><span>Discount:</span><span>-{formatCurrency(data.totalDiscount)}</span></div>
              )}
              <div className="flex justify-between py-1"><span>Taxable:</span><span>{formatCurrency(data.taxable)}</span></div>
              {data.cgst > 0 && <div className="flex justify-between py-1"><span>CGST:</span><span>{formatCurrency(data.cgst)}</span></div>}
              {data.sgst > 0 && <div className="flex justify-between py-1"><span>SGST:</span><span>{formatCurrency(data.sgst)}</span></div>}
              {data.igst > 0 && <div className="flex justify-between py-1"><span>IGST:</span><span>{formatCurrency(data.igst)}</span></div>}
              {data.roundOff !== 0 && (
                <div className="flex justify-between py-1"><span>Round Off:</span><span>{formatCurrency(data.roundOff)}</span></div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-gray-800 font-bold text-base">
                <span>Grand Total:</span>
                <span>{formatCurrency(data.grandTotal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bank Details */}
        {type !== 'challan' && co.bankName && co.bankAccountNo && (
          <div className="mt-6 text-xs border border-gray-300 rounded p-3">
            <p className="font-semibold mb-1">Bank Details for Payment:</p>
            <div className="grid grid-cols-2 gap-1">
              <span>Bank: {co.bankName}{co.bankBranch ? `, ${co.bankBranch}` : ''}</span>
              <span>A/c No: {co.bankAccountNo}</span>
              <span>IFSC: {co.bankIfsc}</span>
              <span>A/c Type: {co.bankAccountType}</span>
            </div>
          </div>
        )}

        {data.narration && (
          <div className="mt-4 text-sm">
            <span className="font-semibold">Narration: </span>{data.narration}
          </div>
        )}

        {/* Terms */}
        {co.termsAndConditions && (
          <div className="mt-4 text-[10px] text-gray-500">
            <p className="font-semibold text-gray-600 mb-0.5">Terms & Conditions:</p>
            <pre className="whitespace-pre-wrap font-sans">{co.termsAndConditions}</pre>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 flex justify-between text-sm">
          <div>
            {co.invoiceNotes && <p className="text-xs text-gray-500 italic mb-8">{co.invoiceNotes}</p>}
            <p className="border-t border-gray-400 pt-1">Receiver's Signature</p>
          </div>
          <div className="text-right">
            <p className="font-semibold mb-8">For {co.name}</p>
            <p className="border-t border-gray-400 pt-1">
              {co.signatory || 'Authorized Signatory'}
            </p>
            {co.designation && <p className="text-xs text-gray-500">{co.designation}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
