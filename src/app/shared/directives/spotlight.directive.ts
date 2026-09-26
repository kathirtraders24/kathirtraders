import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Premium hover effect: a soft neon highlight that follows the cursor across
 * the element. Sets CSS custom properties (--mx/--my/--spot) that the
 * `.kt-spotlight` style consumes. Purely presentational.
 *
 *   <mat-card class="kt-spotlight" ktSpotlight>…</mat-card>
 */
@Directive({
  selector: '[ktSpotlight]',
  standalone: true,
})
export class SpotlightDirective {
  private el = inject(ElementRef<HTMLElement>);

  @HostListener('pointermove', ['$event'])
  onMove(event: PointerEvent): void {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const style = this.el.nativeElement.style;
    style.setProperty('--mx', `${event.clientX - rect.left}px`);
    style.setProperty('--my', `${event.clientY - rect.top}px`);
    style.setProperty('--spot', '1');
  }

  @HostListener('pointerleave')
  onLeave(): void {
    this.el.nativeElement.style.setProperty('--spot', '0');
  }
}
