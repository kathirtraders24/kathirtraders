import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as XLSX from 'xlsx';
import { ProductService, ImportProduct, BulkImportResult } from '../services/product.service';
import { NotificationService } from '../../../core';

interface PreviewRow {
  rowNum: number;
  product: ImportProduct | null;
  display: { sku: string; name: string; category: string; price: string; qty: string };
  valid: boolean;
  errors: string[];
}

// Column aliases → canonical field. Headers are normalized (lowercased, stripped
// of spaces/symbols) so "Unit Price (₹)", "unit_price" and "price" all match.
const COLUMN_ALIASES: Record<string, string[]> = {
  sku: ['sku', 'code', 'itemcode'],
  name: ['name', 'productname', 'product', 'itemname'],
  category: ['category', 'cat'],
  subCategory: ['subcategory', 'subcat', 'group'],
  unit: ['unit', 'uom'],
  hsnCode: ['hsncode', 'hsn'],
  gstRate: ['gstrate', 'gst', 'gstpercent', 'tax'],
  unitPrice: ['unitprice', 'price', 'rate', 'mrp', 'unitpricers', 'unitprice₹'],
  quantityOnHand: ['quantityonhand', 'quantity', 'qty', 'stock', 'openingstock'],
  reorderLevel: ['reorderlevel', 'reorder', 'minstock', 'reorderqty'],
};

@Component({
  selector: 'app-product-import-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-import-dialog.component.html',
  styleUrl: './product-import-dialog.component.scss',
})
export class ProductImportDialogComponent {
  private dialogRef = inject(MatDialogRef<ProductImportDialogComponent>);
  private productService = inject(ProductService);
  private notify = inject(NotificationService);

  fileName = signal('');
  rows = signal<PreviewRow[]>([]);
  parsing = signal(false);
  importing = signal(false);
  result = signal<BulkImportResult | null>(null);

  validCount = computed(() => this.rows().filter((r) => r.valid).length);
  invalidCount = computed(() => this.rows().filter((r) => !r.valid).length);
  previewRows = computed(() => this.rows().slice(0, 100));

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.fileName.set(file.name);
    this.result.set(null);
    this.parsing.set(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      this.rows.set(json.map((raw, i) => this.parseRow(raw, i + 2))); // +2: header row + 1-based
      if (json.length === 0) {
        this.notify.warning('No rows found in the file');
      }
    } catch {
      this.notify.error('Could not read the file. Please use a valid Excel or CSV file.');
      this.rows.set([]);
    } finally {
      this.parsing.set(false);
      input.value = ''; // allow re-selecting the same file
    }
  }

  private parseRow(raw: Record<string, any>, rowNum: number): PreviewRow {
    const lookup = this.buildLookup(raw);
    const errors: string[] = [];

    const sku = this.str(lookup['sku']);
    const name = this.str(lookup['name']);
    const category = this.str(lookup['category']).toLowerCase();
    const subCategory = this.str(lookup['subCategory']);
    const unit = this.str(lookup['unit']).toLowerCase();
    const hsnCode = this.str(lookup['hsnCode']);
    const gstRate = this.num(lookup['gstRate']);
    const unitPriceRupees = this.num(lookup['unitPrice']);
    const quantity = this.numOrNull(lookup['quantityOnHand']);
    const reorder = this.numOrNull(lookup['reorderLevel']);

    if (!sku) errors.push('SKU is required');
    if (!name) errors.push('Name is required');
    if (category !== 'plumbing' && category !== 'electrical') errors.push('Category must be "plumbing" or "electrical"');
    if (!subCategory) errors.push('Sub-category is required');
    if (!unit) errors.push('Unit is required');
    if (!hsnCode) errors.push('HSN code is required');
    if (gstRate === null || gstRate < 0 || gstRate > 100) errors.push('GST rate must be 0–100');
    if (unitPriceRupees === null || unitPriceRupees < 0) errors.push('Unit price must be a positive number');

    const valid = errors.length === 0;
    const product: ImportProduct | null = valid
      ? {
          sku,
          name,
          category: category as 'plumbing' | 'electrical',
          subCategory,
          unit,
          hsnCode,
          gstRate: gstRate!,
          unitPrice: Math.round(unitPriceRupees! * 100),
          description: this.str(lookup['description']) || undefined,
          quantityOnHand: quantity ?? undefined,
          reorderLevel: reorder ?? undefined,
        }
      : null;

    return {
      rowNum,
      product,
      valid,
      errors,
      display: {
        sku: sku || '—',
        name: name || '—',
        category: category || '—',
        price: unitPriceRupees !== null ? `₹${unitPriceRupees.toLocaleString('en-IN')}` : '—',
        qty: quantity !== null ? String(quantity) : '0',
      },
    };
  }

  /** Map a raw row's headers to canonical fields via the alias table. */
  private buildLookup(raw: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    for (const key of Object.keys(raw)) {
      normalized[this.normalizeHeader(key)] = raw[key];
    }
    const out: Record<string, any> = {};
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      for (const alias of aliases) {
        if (alias in normalized) {
          out[field] = normalized[alias];
          break;
        }
      }
    }
    out['description'] = normalized['description'] ?? '';
    return out;
  }

  private normalizeHeader(h: string): string {
    return String(h).toLowerCase().replace(/[^a-z0-9₹]/g, '');
  }

  private str(v: any): string {
    return v === null || v === undefined ? '' : String(v).trim();
  }

  private num(v: any): number | null {
    const n = this.numOrNull(v);
    return n;
  }

  private numOrNull(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    const cleaned = String(v).replace(/[^0-9.\-]/g, '');
    if (cleaned === '') return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  downloadTemplate(): void {
    const sample = [
      {
        SKU: 'PLB-001', Name: 'PVC Pipe 1 inch', Category: 'plumbing', 'Sub-Category': 'pipes',
        Unit: 'mtr', 'HSN Code': '3917', 'GST Rate': 18, 'Unit Price': 120, Quantity: 50, 'Reorder Level': 10,
        Description: 'Rigid PVC pipe',
      },
      {
        SKU: 'ELE-001', Name: 'Modular Switch 6A', Category: 'electrical', 'Sub-Category': 'switches',
        Unit: 'nos', 'HSN Code': '8536', 'GST Rate': 18, 'Unit Price': 45, Quantity: 200, 'Reorder Level': 25,
        Description: '',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'kathir-traders-product-import-template.xlsx');
  }

  runImport(): void {
    const valid = this.rows().filter((r) => r.valid && r.product).map((r) => r.product!);
    if (valid.length === 0) return;

    this.importing.set(true);
    this.productService.bulkCreate(valid).subscribe({
      next: (res) => {
        this.importing.set(false);
        this.result.set(res);
        if (res.created > 0) {
          this.notify.success(`${res.created} product${res.created === 1 ? '' : 's'} imported`);
        }
        if (res.created === 0) {
          this.notify.warning('No products were imported');
        }
      },
      error: () => {
        this.importing.set(false);
        this.notify.error('Import failed. Please try again.');
      },
    });
  }

  done(): void {
    this.dialogRef.close(this.result()?.created ?? 0);
  }

  cancel(): void {
    this.dialogRef.close(0);
  }
}
