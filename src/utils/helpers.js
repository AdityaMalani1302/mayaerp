import { format, parseISO, differenceInDays } from 'date-fns';

export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(num);
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(Number(num) || 0);
};

export const formatDate = (date) => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd/MM/yyyy');
  } catch {
    return '';
  }
};

export const formatDateForInput = (date) => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

export const today = () => format(new Date(), 'yyyy-MM-dd');

export const getAgeing = (dateStr) => {
  if (!dateStr) return '90+';
  const days = differenceInDays(new Date(), parseISO(dateStr));
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
};

export const generateNumber = (prefix, list) => {
  const num = (list?.length || 0) + 1;
  return `${prefix}-${String(num).padStart(4, '0')}`;
};

export const roundOff = (amount) => {
  const rounded = Math.round(amount);
  return { rounded, diff: rounded - amount };
};

export const calculateLineItem = (item) => {
  const qty = Number(item.qty) || 0;
  const rate = Number(item.rate) || 0;
  const discountPercent = Number(item.discountPercent) || 0;
  const taxPercent = Number(item.taxPercent) || 0;

  const gross = qty * rate;
  const discountAmount = gross * (discountPercent / 100);
  const taxableAmount = gross - discountAmount;
  const taxAmount = taxableAmount * (taxPercent / 100);
  const netAmount = taxableAmount + taxAmount;

  return {
    ...item,
    gross: Number(gross.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    netAmount: Number(netAmount.toFixed(2)),
  };
};

export const calculateInvoiceSummary = (items, isInterState = false) => {
  const subtotal = items.reduce((sum, i) => sum + (i.gross || 0), 0);
  const totalDiscount = items.reduce((sum, i) => sum + (i.discountAmount || 0), 0);
  const taxable = items.reduce((sum, i) => sum + (i.taxableAmount || 0), 0);
  const totalTax = items.reduce((sum, i) => sum + (i.taxAmount || 0), 0);

  let cgst = 0, sgst = 0, igst = 0;
  if (isInterState) {
    igst = totalTax;
  } else {
    cgst = totalTax / 2;
    sgst = totalTax / 2;
  }

  const beforeRound = taxable + totalTax;
  const { rounded: grandTotal, diff: roundOffAmt } = roundOff(beforeRound);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    taxable: Number(taxable.toFixed(2)),
    cgst: Number(cgst.toFixed(2)),
    sgst: Number(sgst.toFixed(2)),
    igst: Number(igst.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    roundOff: Number(roundOffAmt.toFixed(2)),
    grandTotal,
  };
};

export const filterByDateRange = (items, dateField, startDate, endDate) => {
  return items.filter(item => {
    const d = item[dateField];
    if (!d) return false;
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });
};

export const searchFilter = (items, searchTerm, fields) => {
  if (!searchTerm) return items;
  const term = searchTerm.toLowerCase();
  return items.filter(item =>
    fields.some(field => {
      const val = item[field];
      return val && String(val).toLowerCase().includes(term);
    })
  );
};

export const paginate = (items, page, perPage = 20) => {
  const start = (page - 1) * perPage;
  return {
    data: items.slice(start, start + perPage),
    totalPages: Math.ceil(items.length / perPage),
    total: items.length,
  };
};
