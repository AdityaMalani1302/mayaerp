import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import FormField, { ErrorSummary } from '../common/FormField';
import { validators, validateForm } from '../../utils/validation';
import {
  Building2, MapPin, FileText, Phone, Landmark,
  Receipt, Save, RotateCcw, CheckCircle2, Calendar
} from 'lucide-react';

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Jammu & Kashmir','Ladakh','Chandigarh','Puducherry','Lakshadweep','Andaman & Nicobar',
  'Dadra & Nagar Haveli',
];

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export default function BusinessProfile() {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState({ ...state.company });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const errors = useMemo(() => {
    const { errors } = validateForm({
      // General
      name: [
        validators.required(form.name, 'Business name'),
        validators.minLength(form.name, 2, 'Business name'),
        validators.maxLength(form.name, 150, 'Business name'),
      ],
      legalName: [validators.maxLength(form.legalName, 200, 'Legal name')],
      industry: [validators.maxLength(form.industry, 100, 'Industry')],

      // Address
      address: [
        validators.required(form.address, 'Address'),
        validators.maxLength(form.address, 300, 'Address'),
      ],
      city: [
        validators.required(form.city, 'City'),
        validators.maxLength(form.city, 100, 'City'),
      ],
      state: [validators.required(form.state, 'State')],
      pincode: [
        form.pincode && !PINCODE_REGEX.test(form.pincode) ? 'Pincode must be 6 digits' : '',
      ],

      // Tax & Legal
      gstin: [
        validators.required(form.gstin, 'GSTIN'),
        form.gstin && form.gstin.length !== 15 ? 'GSTIN must be exactly 15 characters' : '',
        form.gstin && form.gstin.length === 15 && !GSTIN_REGEX.test(form.gstin.toUpperCase()) ? 'Invalid GSTIN format' : '',
      ],
      pan: [
        form.pan && !PAN_REGEX.test(form.pan.toUpperCase()) ? 'Invalid PAN format (e.g. AADCA1234B)' : '',
      ],

      // Contact
      phone: [validators.phone(form.phone)],
      mobile: [
        form.mobile ? validators.phone(form.mobile) : '',
      ],
      email: [
        validators.required(form.email, 'Email'),
        validators.email(form.email),
      ],
      website: [
        form.website && !form.website.match(/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i) ? 'Invalid website URL' : '',
      ],

      // Financial Year
      financialYear: [validators.required(form.financialYear, 'Financial year')],
      yearStart: [validators.required(form.yearStart, 'Year start date')],
      yearEnd: [
        validators.required(form.yearEnd, 'Year end date'),
        form.yearStart && form.yearEnd && form.yearEnd <= form.yearStart ? 'End date must be after start date' : '',
      ],

      // Bank
      bankIfsc: [
        form.bankIfsc && !IFSC_REGEX.test(form.bankIfsc.toUpperCase()) ? 'Invalid IFSC format (e.g. HDFC0001234)' : '',
      ],
      bankAccountNo: [
        form.bankAccountNo && (form.bankAccountNo.length < 9 || form.bankAccountNo.length > 18) ? 'Account number must be 9-18 digits' : '',
      ],

      // Signatory
      signatory: [validators.maxLength(form.signatory, 100, 'Signatory name')],
      designation: [validators.maxLength(form.designation, 100, 'Designation')],

      // Invoice
      invoicePrefix: [
        validators.maxLength(form.invoicePrefix, 10, 'Invoice prefix'),
        form.invoicePrefix && !/^[A-Z0-9-]+$/i.test(form.invoicePrefix) ? 'Only letters, numbers, hyphens allowed' : '',
      ],
      termsAndConditions: [validators.maxLength(form.termsAndConditions, 2000, 'Terms & conditions')],
      invoiceNotes: [validators.maxLength(form.invoiceNotes, 500, 'Invoice notes')],
    });
    return errors;
  }, [form]);

  const hasErrors = Object.values(errors).some(e => e);
  const touch = (field) => { setTouched(prev => ({ ...prev, [field]: true })); setSaved(false); };

  const handleSave = () => {
    setSubmitted(true);
    const allTouched = {};
    Object.keys(errors).forEach(k => { allTouched[k] = true; });
    setTouched(allTouched);
    if (hasErrors) return;

    dispatch({ type: 'UPDATE_COMPANY', payload: form });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Reset all changes to last saved values?')) {
      setForm({ ...state.company });
      setTouched({});
      setSubmitted(false);
      setSaved(false);
    }
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(state.company);

  const tabs = [
    { key: 'general', label: 'General', icon: Building2 },
    { key: 'address', label: 'Address', icon: MapPin },
    { key: 'tax', label: 'Tax & Legal', icon: FileText },
    { key: 'contact', label: 'Contact', icon: Phone },
    { key: 'bank', label: 'Bank Details', icon: Landmark },
    { key: 'financial', label: 'Financial Year', icon: Calendar },
    { key: 'invoice', label: 'Invoice Settings', icon: Receipt },
  ];

  // Count errors per tab
  const tabErrors = useMemo(() => {
    const tabFieldMap = {
      general: ['name', 'legalName', 'industry'],
      address: ['address', 'city', 'state', 'pincode'],
      tax: ['gstin', 'pan'],
      contact: ['phone', 'mobile', 'email', 'website'],
      bank: ['bankIfsc', 'bankAccountNo'],
      financial: ['financialYear', 'yearStart', 'yearEnd'],
      invoice: ['invoicePrefix', 'termsAndConditions', 'invoiceNotes', 'signatory', 'designation'],
    };
    const counts = {};
    Object.entries(tabFieldMap).forEach(([tab, fields]) => {
      counts[tab] = fields.filter(f => errors[f]).length;
    });
    return counts;
  }, [errors]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Business Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your company information, tax details, and invoice settings</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium animate-pulse">
              <CheckCircle2 size={18} /> Saved successfully
            </span>
          )}
          {isDirty && !saved && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Unsaved changes</span>
          )}
          <button onClick={handleReset} disabled={!isDirty} className="btn btn-secondary flex items-center gap-2">
            <RotateCcw size={16} /> Reset
          </button>
          <button onClick={handleSave} disabled={submitted && hasErrors} className="btn btn-primary flex items-center gap-2">
            <Save size={16} /> Save Profile
          </button>
        </div>
      </div>

      {submitted && hasErrors && <ErrorSummary errors={errors} show={true} />}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const errCount = tabErrors[tab.key] || 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {submitted && errCount > 0 && (
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{errCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="card">
        {/* ─── General ─── */}
        {activeTab === 'general' && (
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Building2 size={18} className="text-blue-600" /> General Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Business / Trade Name" required error={errors.name} touched={touched.name || submitted}>
                <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} onBlur={() => touch('name')} maxLength={150} placeholder="Name shown on invoices & header" />
              </FormField>

              <FormField label="Legal / Registered Name" error={errors.legalName} touched={touched.legalName || submitted} hint="As per registration certificate">
                <input className="input" value={form.legalName} onChange={e => setForm({...form, legalName: e.target.value})} onBlur={() => touch('legalName')} maxLength={200} placeholder="e.g. ABC Trading Company Pvt. Ltd." />
              </FormField>

              <FormField label="Industry / Business Type" error={errors.industry} touched={touched.industry || submitted}>
                <select className="input" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})}>
                  <option value="">-- Select --</option>
                  <option>Trading</option>
                  <option>Manufacturing</option>
                  <option>Retail</option>
                  <option>Wholesale</option>
                  <option>Distribution</option>
                  <option>Services</option>
                  <option>Import/Export</option>
                  <option>Other</option>
                </select>
              </FormField>

              <FormField label="Currency">
                <select className="input" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                  <option value="INR">INR - Indian Rupee (₹)</option>
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="GBP">GBP - British Pound (£)</option>
                </select>
              </FormField>
            </div>
          </div>
        )}

        {/* ─── Address ─── */}
        {activeTab === 'address' && (
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><MapPin size={18} className="text-blue-600" /> Registered Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Street Address" required error={errors.address} touched={touched.address || submitted} className="md:col-span-2">
                <textarea className="input" rows={2} value={form.address} onChange={e => setForm({...form, address: e.target.value})} onBlur={() => touch('address')} maxLength={300} placeholder="Building, Street, Area" />
              </FormField>

              <FormField label="City" required error={errors.city} touched={touched.city || submitted}>
                <input className="input" value={form.city} onChange={e => setForm({...form, city: e.target.value})} onBlur={() => touch('city')} maxLength={100} />
              </FormField>

              <FormField label="State" required error={errors.state} touched={touched.state || submitted}>
                <select className="input" value={form.state} onChange={e => setForm({...form, state: e.target.value})} onBlur={() => touch('state')}>
                  <option value="">-- Select State --</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>

              <FormField label="Pincode" error={errors.pincode} touched={touched.pincode || submitted}>
                <input className="input" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value.replace(/\D/g, '')})} onBlur={() => touch('pincode')} maxLength={6} placeholder="400069" />
              </FormField>

              <FormField label="Country">
                <input className="input" value={form.country} onChange={e => setForm({...form, country: e.target.value})} maxLength={50} />
              </FormField>
            </div>

            {/* Address Preview */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Address Preview (as printed on invoices)</p>
              <p className="text-sm text-gray-800 leading-relaxed">
                {form.name}<br/>
                {form.address && <>{form.address}<br/></>}
                {[form.city, form.state, form.pincode].filter(Boolean).join(', ')}<br/>
                {form.country}
              </p>
            </div>
          </div>
        )}

        {/* ─── Tax & Legal ─── */}
        {activeTab === 'tax' && (
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-600" /> Tax & Legal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="GSTIN" required error={errors.gstin} touched={touched.gstin || submitted} hint="15-character GST Identification Number">
                <input className="input font-mono tracking-wider" value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')})} onBlur={() => touch('gstin')} maxLength={15} placeholder="27AADCA1234B1Z5" style={{ textTransform: 'uppercase' }} />
              </FormField>

              <FormField label="PAN" error={errors.pan} touched={touched.pan || submitted} hint="10-character Permanent Account Number">
                <input className="input font-mono tracking-wider" value={form.pan} onChange={e => setForm({...form, pan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')})} onBlur={() => touch('pan')} maxLength={10} placeholder="AADCA1234B" style={{ textTransform: 'uppercase' }} />
              </FormField>

              <FormField label="CIN (Company Identification Number)" hint="For registered companies only">
                <input className="input font-mono tracking-wider" value={form.cin} onChange={e => setForm({...form, cin: e.target.value.toUpperCase()})} maxLength={21} placeholder="U12345MH2020PTC123456" style={{ textTransform: 'uppercase' }} />
              </FormField>
            </div>

            {/* GSTIN breakdown */}
            {form.gstin && form.gstin.length === 15 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-xs font-semibold text-blue-600 uppercase mb-2">GSTIN Breakdown</p>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">State Code</span>
                    <p className="font-mono font-semibold">{form.gstin.substring(0, 2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">PAN</span>
                    <p className="font-mono font-semibold">{form.gstin.substring(2, 12)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Entity No</span>
                    <p className="font-mono font-semibold">{form.gstin.substring(12, 13)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Check Digit</span>
                    <p className="font-mono font-semibold">{form.gstin.substring(13, 15)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Contact ─── */}
        {activeTab === 'contact' && (
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Phone size={18} className="text-blue-600" /> Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Phone (Landline)" error={errors.phone} touched={touched.phone || submitted}>
                <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/[^0-9+\-\s()]/g, '')})} onBlur={() => touch('phone')} maxLength={15} placeholder="022-12345678" />
              </FormField>

              <FormField label="Mobile" error={errors.mobile} touched={touched.mobile || submitted}>
                <input className="input" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value.replace(/[^0-9+\-\s()]/g, '')})} onBlur={() => touch('mobile')} maxLength={15} placeholder="9876543210" />
              </FormField>

              <FormField label="Email" required error={errors.email} touched={touched.email || submitted}>
                <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} onBlur={() => touch('email')} maxLength={150} placeholder="info@company.com" />
              </FormField>

              <FormField label="Website" error={errors.website} touched={touched.website || submitted}>
                <input className="input" value={form.website} onChange={e => setForm({...form, website: e.target.value})} onBlur={() => touch('website')} maxLength={150} placeholder="https://www.company.com" />
              </FormField>
            </div>
          </div>
        )}

        {/* ─── Bank Details ─── */}
        {activeTab === 'bank' && (
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Landmark size={18} className="text-blue-600" /> Bank Account Details</h3>
            <p className="text-sm text-gray-500 mb-4">These details will appear on your printed invoices for customer payments.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Bank Name">
                <input className="input" value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})} maxLength={100} placeholder="e.g. HDFC Bank" />
              </FormField>

              <FormField label="Branch">
                <input className="input" value={form.bankBranch} onChange={e => setForm({...form, bankBranch: e.target.value})} maxLength={100} placeholder="e.g. Andheri East" />
              </FormField>

              <FormField label="Account Number" error={errors.bankAccountNo} touched={touched.bankAccountNo || submitted}>
                <input className="input font-mono" value={form.bankAccountNo} onChange={e => setForm({...form, bankAccountNo: e.target.value.replace(/\D/g, '')})} onBlur={() => touch('bankAccountNo')} maxLength={18} placeholder="50100123456789" />
              </FormField>

              <FormField label="IFSC Code" error={errors.bankIfsc} touched={touched.bankIfsc || submitted} hint="11-character code (e.g. HDFC0001234)">
                <input className="input font-mono" value={form.bankIfsc} onChange={e => setForm({...form, bankIfsc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')})} onBlur={() => touch('bankIfsc')} maxLength={11} placeholder="HDFC0001234" style={{ textTransform: 'uppercase' }} />
              </FormField>

              <FormField label="Account Type">
                <select className="input" value={form.bankAccountType} onChange={e => setForm({...form, bankAccountType: e.target.value})}>
                  <option>Current</option>
                  <option>Savings</option>
                  <option>OD (Overdraft)</option>
                  <option>CC (Cash Credit)</option>
                </select>
              </FormField>
            </div>

            {/* Bank Preview */}
            {form.bankName && form.bankAccountNo && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Bank Details Preview (as printed on invoices)</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Bank:</span> {form.bankName}{form.bankBranch ? `, ${form.bankBranch}` : ''}</div>
                  <div><span className="text-gray-500">A/c No:</span> <span className="font-mono">{form.bankAccountNo}</span></div>
                  <div><span className="text-gray-500">IFSC:</span> <span className="font-mono">{form.bankIfsc}</span></div>
                  <div><span className="text-gray-500">Type:</span> {form.bankAccountType} Account</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Financial Year ─── */}
        {activeTab === 'financial' && (
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Calendar size={18} className="text-blue-600" /> Financial Year Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FormField label="Financial Year Label" required error={errors.financialYear} touched={touched.financialYear || submitted} hint="Displayed in header">
                <input className="input" value={form.financialYear} onChange={e => setForm({...form, financialYear: e.target.value})} onBlur={() => touch('financialYear')} maxLength={10} placeholder="2025-26" />
              </FormField>

              <FormField label="Year Start Date" required error={errors.yearStart} touched={touched.yearStart || submitted}>
                <input className="input" type="date" value={form.yearStart} onChange={e => setForm({...form, yearStart: e.target.value})} onBlur={() => touch('yearStart')} />
              </FormField>

              <FormField label="Year End Date" required error={errors.yearEnd} touched={touched.yearEnd || submitted}>
                <input className="input" type="date" value={form.yearEnd} onChange={e => setForm({...form, yearEnd: e.target.value})} onBlur={() => touch('yearEnd')} min={form.yearStart} />
              </FormField>
            </div>

            <div className="mt-4">
              <FormField label="Date Display Format">
                <select className="input max-w-xs" value={form.dateFormat} onChange={e => setForm({...form, dateFormat: e.target.value})}>
                  <option value="dd/MM/yyyy">DD/MM/YYYY (31/03/2026)</option>
                  <option value="MM/dd/yyyy">MM/DD/YYYY (03/31/2026)</option>
                  <option value="yyyy-MM-dd">YYYY-MM-DD (2026-03-31)</option>
                  <option value="dd-MMM-yyyy">DD-MMM-YYYY (31-Mar-2026)</option>
                </select>
              </FormField>
            </div>
          </div>
        )}

        {/* ─── Invoice Settings ─── */}
        {activeTab === 'invoice' && (
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Receipt size={18} className="text-blue-600" /> Invoice & Document Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Authorized Signatory Name" error={errors.signatory} touched={touched.signatory || submitted}>
                <input className="input" value={form.signatory} onChange={e => setForm({...form, signatory: e.target.value})} onBlur={() => touch('signatory')} maxLength={100} placeholder="Name to print on invoices" />
              </FormField>

              <FormField label="Designation" error={errors.designation} touched={touched.designation || submitted}>
                <input className="input" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} onBlur={() => touch('designation')} maxLength={100} placeholder="e.g. Managing Director" />
              </FormField>

              <FormField label="Invoice Number Prefix" error={errors.invoicePrefix} touched={touched.invoicePrefix || submitted} hint="e.g. INV, SI, BILL">
                <input className="input font-mono" value={form.invoicePrefix} onChange={e => setForm({...form, invoicePrefix: e.target.value.toUpperCase()})} onBlur={() => touch('invoicePrefix')} maxLength={10} placeholder="INV" style={{ textTransform: 'uppercase' }} />
              </FormField>
            </div>

            <FormField label="Default Invoice Notes / Thank You Message" error={errors.invoiceNotes} touched={touched.invoiceNotes || submitted} className="mt-4">
              <textarea className="input" rows={2} value={form.invoiceNotes} onChange={e => setForm({...form, invoiceNotes: e.target.value})} onBlur={() => touch('invoiceNotes')} maxLength={500} placeholder="Printed at the bottom of every invoice" />
            </FormField>

            <FormField label="Terms & Conditions" error={errors.termsAndConditions} touched={touched.termsAndConditions || submitted} hint="Printed on the back of invoices or as a footer" className="mt-4">
              <textarea className="input" rows={5} value={form.termsAndConditions} onChange={e => setForm({...form, termsAndConditions: e.target.value})} onBlur={() => touch('termsAndConditions')} maxLength={2000} placeholder="1. Goods once sold will not be taken back.&#10;2. Interest @ 18% p.a. will be charged on overdue payments." />
            </FormField>

            {/* Invoice Preview */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Invoice Footer Preview</p>
              <div className="border-t border-gray-300 pt-3 text-sm">
                {form.invoiceNotes && <p className="text-gray-600 italic mb-3">{form.invoiceNotes}</p>}
                {form.termsAndConditions && (
                  <div className="text-xs text-gray-500">
                    <p className="font-semibold mb-1">Terms & Conditions:</p>
                    <pre className="whitespace-pre-wrap font-sans">{form.termsAndConditions}</pre>
                  </div>
                )}
                {form.signatory && (
                  <div className="text-right mt-6">
                    <p className="font-semibold">For {form.name}</p>
                    <p className="mt-8 text-gray-500">___________________</p>
                    <p className="text-sm">{form.signatory}</p>
                    {form.designation && <p className="text-xs text-gray-500">{form.designation}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Bar (sticky) */}
      {isDirty && (
        <div className="sticky bottom-0 mt-4 bg-white border border-gray-200 rounded-xl shadow-lg px-6 py-3 flex items-center justify-between z-10">
          <span className="text-sm text-gray-600">
            <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
            You have unsaved changes
          </span>
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="btn btn-secondary btn-sm">Discard</button>
            <button onClick={handleSave} disabled={submitted && hasErrors} className="btn btn-primary btn-sm flex items-center gap-1.5">
              <Save size={14} /> Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
