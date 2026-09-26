import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Cinematic page transition applied to the router-outlet wrapper.
 * Fires on every navigation (bound to a value that changes per route),
 * fading and gently lifting the incoming view into place.
 */
export const routeFade = trigger('routeFade', [
  transition('* => *', [
    style({ opacity: 0, transform: 'translateY(12px) scale(0.995)' }),
    animate(
      '360ms cubic-bezier(0.22, 1, 0.36, 1)',
      style({ opacity: 1, transform: 'translateY(0) scale(1)' }),
    ),
  ]),
]);
