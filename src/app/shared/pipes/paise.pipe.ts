import { Pipe, PipeTransform } from '@angular/core';
import { PaiseAmount } from '../models';

@Pipe({
  name: 'paise',
  standalone: true,
})
export class PaisePipe implements PipeTransform {
  transform(value: PaiseAmount | null | undefined): string {
    if (value == null) return '₹0.00';
    const rupees = value / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rupees);
  }
}
