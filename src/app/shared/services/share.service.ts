import { Injectable } from '@angular/core';
import { SHOP } from '../constants/shop';

export interface ShareDocument {
  kind: 'Invoice' | 'Estimation' | 'Bill';
  number: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  grandTotal: number; // paise
  balance?: number;   // paise, when partially/unpaid
}

@Injectable({ providedIn: 'root' })
export class ShareService {
  /** Compose a customer-facing message and open WhatsApp with it. */
  whatsappDocument(doc: ShareDocument): void {
    this.openWhatsApp(doc.customerPhone, this.buildMessage(doc));
  }

  /** Compose a customer-facing message and open the SMS app with it. */
  smsDocument(doc: ShareDocument): void {
    this.openSms(doc.customerPhone, this.buildMessage(doc));
  }

  openWhatsApp(phone: string | undefined, message: string): void {
    const normalized = this.normalizePhone(phone);
    const base = normalized ? `https://wa.me/${normalized}` : 'https://wa.me/';
    window.open(`${base}?text=${encodeURIComponent(message)}`, '_blank');
  }

  openSms(phone: string | undefined, message: string): void {
    const normalized = this.normalizePhone(phone);
    // `sms:` uses ?body= on Android and &body= on iOS; ?body= is the widely-supported form.
    window.open(`sms:${normalized ?? ''}?body=${encodeURIComponent(message)}`, '_self');
  }

  private buildMessage(doc: ShareDocument): string {
    const lines = [
      `*${SHOP.name}*`,
      SHOP.tagline,
      '',
      `${doc.kind} No: ${doc.number}`,
      `Date: ${this.formatDate(doc.date)}`,
    ];
    if (doc.customerName) lines.push(`Customer: ${doc.customerName}`);
    lines.push(`Total: ${this.formatMoney(doc.grandTotal)}`);
    if (doc.balance != null && doc.balance > 0) {
      lines.push(`Balance Due: ${this.formatMoney(doc.balance)}`);
    }
    lines.push('', `Thank you for your business!`, `Ph: ${SHOP.phones[0]}`);
    return lines.join('\n');
  }

  private normalizePhone(phone: string | undefined): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return '91' + digits;      // Indian mobile
    if (digits.length === 12 && digits.startsWith('91')) return digits;
    return digits || null;
  }

  private formatMoney(paise: number): string {
    return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private formatDate(date: string): string {
    const d = new Date(date);
    return isNaN(d.getTime()) ? date : d.toLocaleDateString('en-IN');
  }
}
