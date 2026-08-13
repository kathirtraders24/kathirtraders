import { ApplicationConfig, provideZoneChangeDetection, isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { authInterceptor, errorInterceptor } from './core';
import { environment } from '../environments/environment';

// Fetches the XSRF-TOKEN cookie from Laravel before any API calls are made.
// Without this, Angular has no cookie to read and the X-XSRF-TOKEN header is
// never sent, causing a 419 CSRF token mismatch on POST/PUT/DELETE requests.
function initCsrf(http: HttpClient) {
  return () => {
    const csrfUrl = environment.apiUrl.replace(/\/api$/, '') + '/sanctum/csrf-cookie';
    return http.get(csrfUrl, { withCredentials: true }).toPromise().catch(() => {});
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor]),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
    provideAnimationsAsync(),
    provideStore(),
    provideEffects(),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    {
      provide: APP_INITIALIZER,
      useFactory: initCsrf,
      deps: [HttpClient],
      multi: true,
    },
  ],
};
