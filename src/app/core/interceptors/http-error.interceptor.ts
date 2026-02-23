import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let detail = 'An unexpected error occurred. Please try again.';

      if (error.status === 0) {
        detail = 'Cannot connect to the server. Please ensure the backend is running on port 8081.';
      } else if (error.status === 404) {
        detail = error.error?.message || 'The requested resource was not found.';
      } else if (error.status === 400) {
        detail = error.error?.message || 'Invalid request. Please check the submitted data.';
      } else if (error.status >= 500) {
        detail = error.error?.message || 'A server error occurred. Please try again later.';
      } else if (error.error?.message) {
        detail = error.error.message;
      }

      messageService.add({
        key: 'global',
        severity: 'error',
        summary: 'Error',
        detail,
        life: 5000
      });

      return throwError(() => ({ ...error, userMessage: detail }));
    })
  );
};
