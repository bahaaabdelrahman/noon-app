import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface AuthResponse {
  token: string;
  user: any;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/v1/auth';
  private currentUserSubject = new BehaviorSubject<any | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadInitialUser();
  }

  public get currentUserValue(): any | null {
    return this.currentUserSubject.value;
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }


  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }


  logout(): void {
  this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
    next: () => {
      localStorage.removeItem('auth_token');
      this.currentUserSubject.next(null);
      this.router.navigate(['/']);
    },
    error: () => {
      localStorage.removeItem('auth_token');
      this.currentUserSubject.next(null);
      this.router.navigate(['/']);
    }
  });
}


  getMe(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      tap(responseFromServer => {
        const userObject = responseFromServer.data || responseFromServer.user || responseFromServer;
        console.log('User object found from /me endpoint:', userObject);
        this.currentUserSubject.next(userObject);
      })
    );
  }

  refreshToken(): Observable<{ token: string }> {
  const refreshToken = localStorage.getItem('refresh_token'); // تأكد من حفظه عند تسجيل الدخول
  return this.http.post<{ token: string }>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
    tap(response => localStorage.setItem('auth_token', response.token))
  );
}

  forgotPassword(email: { email: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, email);
  }

  resetPassword(data: { token: string; password_or_pin: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }


  private setSession(authResponse: any) {
  const accessToken = authResponse?.data?.tokens?.accessToken;
  const refreshToken = authResponse?.data?.tokens?.refreshToken;

  if (accessToken) {
    localStorage.setItem('auth_token', accessToken);

    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }

    const userObject = authResponse?.data?.user;
    this.currentUserSubject.next(userObject);

    console.log('SUCCESS: auth_token has been saved to localStorage.');

  } else {
    console.error('FAILURE: Could not find accessToken in login response.');
  }
}

  private loadInitialUser() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.getMe().subscribe({
        error: () => this.logout()
      });
    }
  }


  changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }): Observable<any> {
  return this.http.post(`${this.apiUrl}/change-password`, data);
}


verifyEmail(userId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/verify-email/${userId}`);
}

resendVerification(): Observable<any> {
  return this.http.post(`${this.apiUrl}/resend-verification`, {});
}
}
