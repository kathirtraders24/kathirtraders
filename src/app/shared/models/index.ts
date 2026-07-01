export type PaiseAmount = number;

export type ProductCategory = 'plumbing' | 'electrical';

export type PaymentMode = 'cash' | 'upi' | 'cheque' | 'neft' | 'credit';

export type InvoiceStatus = 'draft' | 'confirmed' | 'cancelled';

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'received' | 'cancelled';

export type EstimationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface EstimationLineItem {
  productId: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unitRate: PaiseAmount;
  discount: PaiseAmount;
  gstRate: number;
  cgst: PaiseAmount;
  sgst: PaiseAmount;
  igst: PaiseAmount;
  lineTotal: PaiseAmount;
}

export interface Estimation {
  id: string;
  estimationNumber: string;
  date: string;
  validUntil: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerGstin?: string;
  lines: EstimationLineItem[];
  subTotal: PaiseAmount;
  totalCgst: PaiseAmount;
  totalSgst: PaiseAmount;
  totalIgst: PaiseAmount;
  grandTotal: PaiseAmount;
  notes?: string;
  status: EstimationStatus;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  subCategory: string;
  unit: string;
  hsnCode: string;
  gstRate: number; // percentage e.g. 18
  unitPrice: PaiseAmount;
  description?: string;
}

export interface StockEntry {
  id: string;
  productId: string;
  warehouseLocation: string;
  quantityOnHand: number;
  reorderLevel: number;
}

export interface Customer {
  id: string;
  name: string;
  gstin?: string;
  phone: string;
  email?: string;
  address: string;
  stateCode: string;
  creditLimit: PaiseAmount;
  outstandingBalance: PaiseAmount;
}

export interface Supplier {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  email?: string;
  address: string;
  stateCode: string;
  paymentTerms: string;
}

export type OrderPaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface PaymentSplit {
  mode: PaymentMode;
  amount: PaiseAmount;
}

export interface OrderLineItem {
  productId: string;
  name: string;
  hsnCode: string;
  quantity: number;
  unitPrice: PaiseAmount;
  discount: PaiseAmount;
  totalPrice: PaiseAmount;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  lines: OrderLineItem[];
  grandTotal: PaiseAmount;
  subtotal?: PaiseAmount;
  overallDiscount?: PaiseAmount;
  discountLabel?: string;
  paymentStatus: OrderPaymentStatus;
  payments: PaymentSplit[];
  createdAt: string;
}

export interface InvoiceLineItem {
  productId: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unitRate: PaiseAmount;
  discount: PaiseAmount;
  gstRate: number;
  cgst: PaiseAmount;
  sgst: PaiseAmount;
  igst: PaiseAmount;
  lineTotal: PaiseAmount;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  lines: InvoiceLineItem[];
  subTotal: PaiseAmount;
  totalCgst: PaiseAmount;
  totalSgst: PaiseAmount;
  totalIgst: PaiseAmount;
  grandTotal: PaiseAmount;
  paymentMode: PaymentMode;
  status: InvoiceStatus;
}

export interface PurchaseOrderLine {
  productId: string;
  productName: string;
  quantity: number;
  unitRate: PaiseAmount;
  lineTotal: PaiseAmount;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  lines: PurchaseOrderLine[];
  totalAmount: PaiseAmount;
  status: PurchaseOrderStatus;
}

export interface Payment {
  id: string;
  referenceId: string;
  referenceType: 'sales_invoice' | 'purchase_order';
  amount: PaiseAmount;
  mode: PaymentMode;
  date: string;
  notes?: string;
}
