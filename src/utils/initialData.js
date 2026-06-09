import { v4 as uuidv4 } from 'uuid';

const id = () => uuidv4();

export const initialParties = [
  { id: id(), name: 'Sharma Electronics', type: 'Customer', gstin: '27AADCS1234F1Z5', phone: '9876543210', email: 'sharma@electronics.com', address: 'Shop 12, MG Road, Mumbai 400001', state: 'Maharashtra', openingBalance: 15000, balanceType: 'Dr' },
  { id: id(), name: 'Patel Traders', type: 'Supplier', gstin: '24AABCP5678G1Z3', phone: '9876501234', email: 'patel@traders.com', address: '45 Industrial Area, Ahmedabad 380015', state: 'Gujarat', openingBalance: 25000, balanceType: 'Cr' },
  { id: id(), name: 'Kumar Retail', type: 'Customer', gstin: '27AABCK9012H1Z1', phone: '9123456789', email: 'kumar@retail.com', address: '78 Station Road, Pune 411001', state: 'Maharashtra', openingBalance: 8500, balanceType: 'Dr' },
  { id: id(), name: 'Singh Distributors', type: 'Both', gstin: '07AADCS3456I1Z9', phone: '9234567890', email: 'singh@dist.com', address: '23 Chandni Chowk, Delhi 110006', state: 'Delhi', openingBalance: 12000, balanceType: 'Cr' },
  { id: id(), name: 'Gupta Suppliers', type: 'Supplier', gstin: '09AABCG7890J1Z7', phone: '9345678901', email: 'gupta@supply.com', address: '56 Civil Lines, Lucknow 226001', state: 'Uttar Pradesh', openingBalance: 30000, balanceType: 'Cr' },
  { id: id(), name: 'Verma & Sons', type: 'Customer', gstin: '27AADCV2345K1Z5', phone: '9456789012', email: 'verma@sons.com', address: '89 Bandra West, Mumbai 400050', state: 'Maharashtra', openingBalance: 5000, balanceType: 'Dr' },
  { id: id(), name: 'Joshi Enterprises', type: 'Supplier', gstin: '29AABCJ6789L1Z3', phone: '9567890123', email: 'joshi@ent.com', address: '12 MG Road, Bangalore 560001', state: 'Karnataka', openingBalance: 18000, balanceType: 'Cr' },
  { id: id(), name: 'Reddy Agencies', type: 'Customer', gstin: '36AADCR0123M1Z1', phone: '9678901234', email: 'reddy@agencies.com', address: '34 Jubilee Hills, Hyderabad 500033', state: 'Telangana', openingBalance: 22000, balanceType: 'Dr' },
];

export const initialItems = [
  { id: id(), name: 'Samsung Galaxy M34', category: 'Electronics', unit: 'pcs', hsnCode: '8517', purchaseRate: 12000, saleRate: 14500, openingStock: 25, currentStock: 25, taxPercent: 18, reorderLevel: 5 },
  { id: id(), name: 'HP Laptop 15s', category: 'Electronics', unit: 'pcs', hsnCode: '8471', purchaseRate: 35000, saleRate: 42000, openingStock: 10, currentStock: 10, taxPercent: 18, reorderLevel: 3 },
  { id: id(), name: 'Boat Earbuds 441', category: 'Electronics', unit: 'pcs', hsnCode: '8518', purchaseRate: 800, saleRate: 1299, openingStock: 100, currentStock: 100, taxPercent: 18, reorderLevel: 20 },
  { id: id(), name: 'Tata Salt 1kg', category: 'FMCG', unit: 'pcs', hsnCode: '2501', purchaseRate: 18, saleRate: 22, openingStock: 500, currentStock: 500, taxPercent: 5, reorderLevel: 100 },
  { id: id(), name: 'Surf Excel 1kg', category: 'FMCG', unit: 'pcs', hsnCode: '3402', purchaseRate: 140, saleRate: 175, openingStock: 200, currentStock: 200, taxPercent: 18, reorderLevel: 50 },
  { id: id(), name: 'Amul Butter 500g', category: 'FMCG', unit: 'pcs', hsnCode: '0405', purchaseRate: 230, saleRate: 275, openingStock: 80, currentStock: 80, taxPercent: 12, reorderLevel: 20 },
  { id: id(), name: 'Havells Fan', category: 'Electrical', unit: 'pcs', hsnCode: '8414', purchaseRate: 1800, saleRate: 2350, openingStock: 30, currentStock: 30, taxPercent: 18, reorderLevel: 5 },
  { id: id(), name: 'Syska LED Bulb 9W', category: 'Electrical', unit: 'pcs', hsnCode: '9405', purchaseRate: 65, saleRate: 99, openingStock: 300, currentStock: 300, taxPercent: 18, reorderLevel: 50 },
  { id: id(), name: 'Classmate Notebook', category: 'Stationery', unit: 'pcs', hsnCode: '4820', purchaseRate: 30, saleRate: 45, openingStock: 400, currentStock: 400, taxPercent: 12, reorderLevel: 100 },
  { id: id(), name: 'Cello Pen Pack (10)', category: 'Stationery', unit: 'pcs', hsnCode: '9608', purchaseRate: 60, saleRate: 85, openingStock: 150, currentStock: 150, taxPercent: 18, reorderLevel: 30 },
  { id: id(), name: 'Basmati Rice 5kg', category: 'FMCG', unit: 'pcs', hsnCode: '1006', purchaseRate: 350, saleRate: 425, openingStock: 100, currentStock: 100, taxPercent: 5, reorderLevel: 25 },
  { id: id(), name: 'Printer Paper A4 (500)', category: 'Stationery', unit: 'pcs', hsnCode: '4802', purchaseRate: 220, saleRate: 290, openingStock: 60, currentStock: 60, taxPercent: 12, reorderLevel: 15 },
];

export const initialAccounts = [
  { id: id(), name: 'Cash', type: 'Cash', balance: 50000 },
  { id: id(), name: 'HDFC Bank - Current', type: 'Bank', balance: 200000 },
  { id: id(), name: 'SBI Bank - Savings', type: 'Bank', balance: 0 },
  { id: id(), name: 'Sales', type: 'Income', balance: 0 },
  { id: id(), name: 'Purchase', type: 'Expense', balance: 0 },
  { id: id(), name: 'Sales Return', type: 'Expense', balance: 0 },
  { id: id(), name: 'Purchase Return', type: 'Income', balance: 0 },
  { id: id(), name: 'Rent', type: 'Expense', balance: 0 },
  { id: id(), name: 'Salary', type: 'Expense', balance: 0 },
  { id: id(), name: 'Transport', type: 'Expense', balance: 0 },
  { id: id(), name: 'Office Expenses', type: 'Expense', balance: 0 },
  { id: id(), name: 'Miscellaneous', type: 'Expense', balance: 0 },
];

export const initialTaxes = [
  { id: id(), name: 'GST 5%', rate: 5 },
  { id: id(), name: 'GST 12%', rate: 12 },
  { id: id(), name: 'GST 18%', rate: 18 },
  { id: id(), name: 'GST 28%', rate: 28 },
  { id: id(), name: 'Exempt', rate: 0 },
];

export const companyInfo = {
  name: 'ABC Trading Co.',
  legalName: 'ABC Trading Company Pvt. Ltd.',
  address: '123 Business Park, Andheri East',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400069',
  country: 'India',
  gstin: '27AADCA1234B1Z5',
  pan: 'AADCA1234B',
  cin: '',
  phone: '022-12345678',
  mobile: '9876543210',
  email: 'info@abctrading.com',
  website: '',
  financialYear: '2025-26',
  yearStart: '2025-04-01',
  yearEnd: '2026-03-31',
  bankName: 'HDFC Bank',
  bankBranch: 'Andheri East',
  bankAccountNo: '50100123456789',
  bankIfsc: 'HDFC0001234',
  bankAccountType: 'Current',
  signatory: 'Rajesh Kumar',
  designation: 'Managing Director',
  industry: 'Trading',
  currency: 'INR',
  dateFormat: 'dd/MM/yyyy',
  logo: '',
  termsAndConditions: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged on overdue payments.\n3. Subject to Mumbai jurisdiction.',
  invoicePrefix: 'INV',
  invoiceNotes: 'Thank you for your business!',
};
