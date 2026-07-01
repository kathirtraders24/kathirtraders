import { Injectable } from '@angular/core';
import { PaiseAmount } from '../../shared/models';

export interface TaxBreakdown {
  taxableAmount: PaiseAmount;
  cgst: PaiseAmount;
  sgst: PaiseAmount;
  igst: PaiseAmount;
  totalTax: PaiseAmount;
}

@Injectable({ providedIn: 'root' })
export class GstService {
  private readonly SELLER_STATE_CODE = '33'; // Tamil Nadu

  calculateTax(
    taxableAmount: PaiseAmount,
    gstRate: number,
    buyerStateCode: string
  ): TaxBreakdown {
    const isInterState = buyerStateCode !== this.SELLER_STATE_CODE;

    if (isInterState) {
      const igst = Math.round(taxableAmount * (gstRate / 100));
      return {
        taxableAmount,
        cgst: 0,
        sgst: 0,
        igst,
        totalTax: igst,
      };
    }

    const cgst = Math.round(taxableAmount * (gstRate / 200));
    const sgst = Math.round(taxableAmount * (gstRate / 200));
    return {
      taxableAmount,
      cgst,
      sgst,
      igst: 0,
      totalTax: cgst + sgst,
    };
  }

  formatGstin(gstin: string): boolean {
    // GSTIN format: 2-digit state code + 10-char PAN + 1 entity + 1 check
    const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
    return pattern.test(gstin);
  }

  getStateCodeFromGstin(gstin: string): string {
    return gstin.substring(0, 2);
  }
}
