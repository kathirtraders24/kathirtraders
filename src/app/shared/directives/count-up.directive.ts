import { Directive, ElementRef, Input, OnChanges, inject } from '@angular/core';

/**
 * Animates a number from 0 up to the target with an ease-out curve, formatting
 * as a plain count or an Indian-locale rupee value. Honors reduced-motion.
 *
 *   <span [ktCountUp]="1234" countUpFormat="currency"></span>
 */
@Directive({
  selector: '[ktCountUp]',
  standalone: true,
})
export class CountUpDirective implements OnChanges {
  private el = inject(ElementRef<HTMLElement>);

  @Input('ktCountUp') value = 0;
  @Input() countUpFormat: 'number' | 'currency' = 'number';
  @Input() countUpDuration = 900;

  private frame = 0;

  ngOnChanges(): void {
    cancelAnimationFrame(this.frame);
    const end = Number(this.value) || 0;

    if (this.prefersReducedMotion()) {
      this.render(end);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / this.countUpDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      this.render(end * eased);
      if (progress < 1) {
        this.frame = requestAnimationFrame(tick);
      }
    };
    this.frame = requestAnimationFrame(tick);
  }

  private render(n: number): void {
    const rounded = Math.round(n);
    const formatted = rounded.toLocaleString('en-IN');
    this.el.nativeElement.textContent =
      this.countUpFormat === 'currency' ? `₹${formatted}` : formatted;
  }

  private prefersReducedMotion(): boolean {
    return typeof matchMedia === 'function'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
