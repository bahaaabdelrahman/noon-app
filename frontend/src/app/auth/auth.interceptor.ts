import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('auth_token');
    const sessionId = this.getOrCreateSessionId();

    let authReq = req;

    if (token) {
      authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    } else {
      authReq = req.clone({
        headers: req.headers.set('x-session-id', sessionId)
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        const message = error?.error?.message || error?.error?.error?.message;

        if (error.status === 401 || message === 'Token has expired') {
          alert('انتهت صلاحية الجلسة، الرجاء تسجيل الدخول مرة أخرى.');
          localStorage.removeItem('auth_token');
          this.router.navigate(['/login']);
        }

        return throwError(() => error);
      })
    );
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }
}
