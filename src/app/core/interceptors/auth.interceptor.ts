import { HttpInterceptorFn } from '@angular/common/http';

function getXsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');
  const csrfToken = getXsrfToken();
  const needsCsrfHeader = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());

  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (needsCsrfHeader && csrfToken && !req.headers.has('X-XSRF-TOKEN')) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  const cloned = req.clone({
    withCredentials: true,
    ...(Object.keys(headers).length ? { setHeaders: headers } : {}),
  });

  return next(cloned);
};
