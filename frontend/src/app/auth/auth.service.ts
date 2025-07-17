import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface AuthResponse {
  token: string;
  user: any;
  data: any; // أضفنا data لاحتمالية وجودها
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

  // 1. دالة تسجيل الدخول (لا تغيير هنا)
  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        // نمرر الرد الكامل إلى setSession
        this.setSession(response);
      })
    );
  }

  // 2. دالة التسجيل (لا تغيير هنا)
  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        // نمرر الرد الكامل إلى setSession
        this.setSession(response);
      })
    );
  }

  // 3. دالة تسجيل الخروج (لا تغيير هنا)
  logout(): void {
    localStorage.removeItem('auth_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  // 4. دالة جلب بيانات المستخدم الحالي ("me") (تم تعديلها)
  getMe(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      tap(responseFromServer => {
        // ▼▼▼ هذا هو التعديل الرئيسي ▼▼▼
        // ابحث عن كائن المستخدم في أي مكان محتمل في الرد
        const userObject = responseFromServer.data || responseFromServer.user || responseFromServer;
        console.log('User object found from /me endpoint:', userObject);
        this.currentUserSubject.next(userObject);
      })
    );
  }

  // ... باقي الدوال تبقى كما هي ...
  refreshToken(): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/refresh`, {}).pipe(
      tap(response => localStorage.setItem('auth_token', response.token))
    );
  }
  forgotPassword(email: { email: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, email);
  }
  resetPassword(data: { token: string; password_or_pin: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }

  // --- دوال مساعدة (تم تعديلها) ---
  private setSession(authResponse: AuthResponse) {
    if (authResponse.token) {
      localStorage.setItem('auth_token', authResponse.token);

      // ▼▼▼ هذا هو التعديل الرئيسي ▼▼▼
      // ابحث عن كائن المستخدم في أي مكان محتمل في الرد
      const userObject = authResponse.data?.user || authResponse.data || authResponse.user;
      console.log('Session set for user:', userObject);
      this.currentUserSubject.next(userObject);
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
}
