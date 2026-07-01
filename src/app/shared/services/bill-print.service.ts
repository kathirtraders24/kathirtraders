import { Injectable } from '@angular/core';

export interface BillLineItem {
  name: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;   // paise
  discount: number;     // paise
  totalPrice: number;   // paise
}

export interface BillConfig {
  title: string;
  date: string;
  lines: BillLineItem[];
  grandTotal: number;   // paise (GST-inclusive when gstPercent is set)
  terms: string[];
  footerNote: string;
  metaFields?: { label: string; value: string }[];
  customerName?: string;
  customerPhone?: string;
  paidAmount?: number;   // paise — when set, balance = grandTotal - paidAmount
  subtotal?: number;     // paise — sum of line totals before discount
  overallDiscount?: number; // paise — discount amount
  discountLabel?: string;  // e.g. 'Discount (10%)' or 'Discount (₹50)'
  gstPercent?: number;     // e.g. 18 — extract CGST+SGST from grandTotal
}

@Injectable({ providedIn: 'root' })
export class BillPrintService {

  print(config: BillConfig): void {
    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (!printWindow) return;

    const html = this.buildHtml(config);
    printWindow.document.write(html);
    printWindow.document.close();

    // Set title to avoid "about:blank" in browser print header/footer
    printWindow.document.title = `${config.title} - Kathir Traders`;
  }

  private buildHtml(config: BillConfig): string {
    const gstPercent = config.gstPercent ?? 0;
    const hasGst = gstPercent > 0;
    const showDiscountColumn = config.lines.some((line) => line.discount > 0);
    const totalQty = config.lines.reduce((sum, line) => sum + line.quantity, 0);

    const rows = config.lines
      .map(
        (line, i) => `
        <tr>
          <td class="center">${i + 1}</td>
          <td class="product">${this.escapeHtml(line.name)}</td>
          <td class="center">${this.escapeHtml(line.hsnCode)}</td>
          <td class="right">${line.quantity}</td>
          <td class="right">${this.formatCurrency(line.unitPrice)}</td>
          ${showDiscountColumn ? `<td class="right">${line.discount > 0 ? this.formatCurrency(line.discount) : ''}</td>` : ''}
          <td class="right">${this.formatCurrency(line.totalPrice)}</td>
        </tr>`
      )
      .join('');

    const emptyRows = Math.max(0, 15 - config.lines.length);
    const blankRows = Array(emptyRows)
      .fill(null)
      .map(
        (_, i) => `
        <tr class="empty-row">
          <td class="center">${config.lines.length + i + 1}</td>
          <td></td><td></td><td></td><td></td>${showDiscountColumn ? '<td></td>' : ''}<td></td>
        </tr>`
      )
      .join('');

    const metaHtml = (config.metaFields ?? [])
      .map((f) => `<span><strong>${this.escapeHtml(f.label)}:</strong> ${this.escapeHtml(f.value)}</span>`)
      .join('');
    const dateMetaHtml = `<span><strong>Date:</strong> ${this.escapeHtml(config.date)}</span>`;

    const customerHtml = (config.customerName || config.customerPhone)
      ? `<div class="customer-row">
          ${config.customerName ? `<span><strong>Customer:</strong> ${this.escapeHtml(config.customerName)}</span>` : ''}
          ${config.customerPhone ? `<span><strong>Mobile:</strong> ${this.escapeHtml(config.customerPhone)}</span>` : ''}
        </div>`
      : '';

    const termsHtml = config.terms
      .map((t) => `<li>${this.escapeHtml(t)}</li>`)
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(config.title)} - Kathir Traders</title>
  <style>${this.getBillCss()}</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <img src="assets/logo.png" class="header-logo" onerror="this.style.display='none'">
      <div class="header-info">
        <div class="shop-name">KATHIR TRADERS</div>
        <div class="shop-tagline">Plumbing &amp; Electrical Accessories</div>
        <div class="shop-address">
          64, Chinna Veethi, Koranattukaruppur, Kumbakonam, Thanjavur, Tamil Nadu - 612501
        </div>
      </div>
      <div class="header-right">
        <div class="phone-row"><strong>Ph:</strong> +91 99657 7163</div>
        <div class="phone-row"><strong>Ph:</strong> +91 95857 7826</div>
        <div class="phone-row"><strong>Email:</strong> kathirtraders24@gmail.com</div>
      </div>
    </div>

    <div class="title-strip">${this.escapeHtml(config.title)}</div>

    <div class="meta-row">
      ${metaHtml}
      ${dateMetaHtml}
    </div>

    ${customerHtml}

    <table class="bill-table">
      <thead>
        <tr>
          <th style="width:30px">S.No</th>
          <th style="min-width:160px">Product Name</th>
          <th style="width:65px">HSN</th>
          <th style="width:45px">Qty</th>
          <th style="width:90px">Unit Price</th>
          ${showDiscountColumn ? '<th style="width:80px">Discount</th>' : ''}
          <th style="width:95px">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        ${blankRows}
      </tbody>
    </table>

    <div class="table-footer-summary">
      <span style="width: 60%; text-align: left;"><strong>Total</strong></span>
      <span style="width: 40%; text-align: right;"><strong>${totalQty}</strong></span>
    </div>

    <div class="total-section">
      <div class="total-box">
        ${config.overallDiscount != null && config.overallDiscount > 0 ? `
        ${config.subtotal != null ? `
        <div class="total-row subtotal">
          <span>Subtotal</span>
          <span>${this.formatCurrency(config.subtotal)}</span>
        </div>` : ''}
        <div class="total-row overall-disc">
          <span>${this.escapeHtml(config.discountLabel ?? 'Discount')}</span>
          <span>- ${this.formatCurrency(config.overallDiscount)}</span>
        </div>` : ''}
        ${hasGst ? (() => {
          const taxable = Math.round(config.grandTotal / (1 + gstPercent / 100));
          const totalGst = config.grandTotal - taxable;
          const cgst = Math.round(totalGst / 2);
          const sgst = totalGst - cgst;
          const halfRate = gstPercent / 2;
          return `
        <div class="total-row gst-row taxable">
          <span>Taxable Amount</span>
          <span>${this.formatCurrency(taxable)}</span>
        </div>
        <div class="total-row gst-row">
          <span>CGST @ ${halfRate}%</span>
          <span>${this.formatCurrency(cgst)}</span>
        </div>
        <div class="total-row gst-row">
          <span>SGST @ ${halfRate}%</span>
          <span>${this.formatCurrency(sgst)}</span>
        </div>`;
        })() : ''}
        <div class="total-row grand">
          <span>Grand Total</span>
          <span>${this.formatCurrency(config.grandTotal)}</span>
        </div>
        ${config.paidAmount != null && config.paidAmount < config.grandTotal ? `
        <div class="total-row paid">
          <span>Paid Amount</span>
          <span>${this.formatCurrency(config.paidAmount)}</span>
        </div>
        <div class="total-row balance">
          <span>Balance to Collect</span>
          <span>${this.formatCurrency(config.grandTotal - config.paidAmount)}</span>
        </div>` : ''}
      </div>
    </div>

    <div class="amount-words">
      <strong>Amount in words:</strong> ${this.numberToWords(config.grandTotal)} Only
    </div>


    <div class="footer">
      <div class="footer-left">
        <p>Thank you for your business!</p>
        <p>${this.escapeHtml(config.footerNote)}</p>
      </div>
      <div class="footer-right">
        <div class="stamp-area"></div>
        <p class="for-label">For Kathir Traders</p>
        <p>Authorized Signatory</p>
      </div>
    </div>

    <div class="bottom-bar"></div>
  </div>

  <script>
    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
  </script>
</body>
</html>`;
  }

  formatCurrency(paise: number): string {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rupees);
  }

  numberToWords(paise: number): string {
    const rupees = Math.floor(paise / 100);
    if (rupees === 0) return 'Zero Rupees';

    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen',
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convert = (n: number): string => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };

    const paiseRemainder = paise % 100;
    let result = 'Rupees ' + convert(rupees);
    if (paiseRemainder > 0) {
      result += ' and ' + convert(paiseRemainder) + ' Paise';
    }
    return result;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  private getBillCss(): string {
    return `
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4 portrait;
      margin: 12mm 10mm;
    }

    @page :first { margin-top: 12mm; }

    html {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Hide browser-generated headers/footers (URL, page number, date) */
    @media print {
      @page { margin: 12mm 10mm; }
      html, body { margin: 0; padding: 0; }
    }

    body {
      font-family: 'Segoe UI', 'Noto Sans', Arial, sans-serif;
      font-size: 12px;
      color: #222;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 190mm;
      min-height: 270mm;
      margin: 0 auto;
      padding: 0;
      position: relative;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: center;
      border-bottom: 3px solid #1a237e;
      padding-bottom: 10px;
      margin-bottom: 6px;
    }

    .header-logo {
      width: 70px;
      height: 70px;
      margin-right: 16px;
      object-fit: contain;
    }

    .header-info { flex: 1; }

    .shop-name {
      font-size: 28px;
      font-weight: 800;
      color: #1a237e;
      letter-spacing: 1.5px;
      line-height: 1.1;
    }

    .shop-tagline {
      font-size: 12px;
      color: #555;
      margin-top: 2px;
      font-style: italic;
    }

    .shop-address {
      font-size: 10.5px;
      color: #444;
      margin-top: 4px;
      line-height: 1.5;
    }

    .header-right { text-align: right; }

    .header-right .phone-row {
      font-size: 11px;
      color: #333;
      margin-bottom: 2px;
    }

    .header-right .phone-row strong { color: #1a237e; }

    /* ── Title strip ── */
    .title-strip {
      background: #1a237e;
      color: #fff;
      text-align: center;
      padding: 7px 0;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin: 10px 0;
    }

    /* ── Meta row ── */
    .meta-row {
      display: flex;
      justify-content: flex-end;
      padding: 4px 0 8px;
      font-size: 11.5px;
    }

    .meta-row span { margin-left: 24px; }
    .meta-row strong { color: #1a237e; }

    /* ── Customer row ── */
    .customer-row {
      display: flex;
      padding: 6px 0 10px;
      font-size: 12px;
      border-bottom: 1px dashed #ccc;
      margin-bottom: 8px;
    }

    .customer-row span { margin-right: 32px; }
    .customer-row strong { color: #1a237e; }

    /* ── Table ── */
    .bill-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
      border: none;
      border-bottom: 1px solid #bbb;
    }

    .bill-table thead th,
    .bill-table tbody td {
      border-top: none;
      border-bottom: none;
      border-left: 1px solid #bbb;
      padding: 4px 6px;
      font-size: 11px;
      line-height: 1.2;
      vertical-align: middle;
    }

    .bill-table thead th:last-child,
    .bill-table tbody td:last-child {
      border-right: 1px solid #bbb;
    }

    .bill-table thead th {
      background: #1a237e;
      color: #fff;
      font-weight: 600;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 6px;
    }

    .bill-table tbody tr {
      border: none;
      background: transparent;
    }

    .bill-table tbody tr:nth-child(even) { background: transparent; }
    .bill-table tbody tr:hover { background: transparent; }
    .bill-table .empty-row td { height: 26px; padding: 7px 8px; }
    .bill-table .product { font-weight: 500; }

    .table-footer-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 6px 0 10px;
      padding: 6px 8px;
      background: #f8f9ff;
      border-top: 1px solid #bbb;
      border-bottom: 1px solid #bbb;
      font-size: 11px;
    }

    .center { text-align: center; }
    .right  { text-align: right; }

    /* ── Total section ── */
    .total-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 0;
    }

    .total-box {
      width: 260px;
      border: 2px solid #1a237e;
      border-top: none;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 10px;
      font-size: 11.5px;
      line-height: 1.3;
      border-top: 1px solid #ddd;
    }

    .total-row.grand {
      background: #1a237e;
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      padding: 8px 10px;
      border-top: none;
    }

    .total-row.paid {
      font-size: 12px;
      color: #2e7d32;
      font-weight: 600;
    }

    .total-row.subtotal {
      font-size: 12px;
      color: #555;
    }

    .total-row.overall-disc {
      font-size: 12px;
      color: #c62828;
      font-weight: 600;
    }

    .total-row.balance {
      font-size: 13px;
      color: #c62828;
      font-weight: 700;
      background: #fff3f3;
      border-top: 2px solid #c62828;
    }

    .total-row.gst-row {
      font-size: 11px;
      color: #333;
    }

    .total-row.gst-row.taxable {
      font-size: 11.5px;
      color: #555;
      border-top: 1px dashed #bbb;
    }

    /* ── Amount in words ── */
    .amount-words {
      margin-top: 12px;
      padding: 8px 12px;
      background: #f8f9ff;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 11px;
    }

    .amount-words strong { color: #1a237e; }

    /* ── Terms & footer ── */
    .terms {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px dashed #999;
    }

    .terms h4 {
      font-size: 10.5px;
      color: #1a237e;
      margin-bottom: 4px;
    }

    .terms ul {
      list-style: disc;
      padding-left: 16px;
      font-size: 9.5px;
      color: #555;
      line-height: 1.6;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 30px;
      padding-top: 10px;
    }

    .footer-left {
      font-size: 9.5px;
      color: #888;
    }

    .footer-right { text-align: center; }

    .stamp-area {
      width: 180px;
      height: 60px;
      border-bottom: 2px solid #333;
      margin-bottom: 4px;
    }

    .footer-right p {
      font-size: 11px;
      font-weight: 600;
      color: #333;
    }

    .footer-right .for-label {
      font-size: 10px;
      color: #666;
      font-weight: 400;
      margin-bottom: 2px;
    }

    /* ── Decorative bottom bar ── */
    .bottom-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #1a237e 0%, #3f51b5 50%, #1a237e 100%);
    }`;
  }
}
