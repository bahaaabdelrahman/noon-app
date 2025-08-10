import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';

export interface CartState {
  _id: string;
  items: any[];
  totalQuantity: number;
  totalPrice: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private baseUrl = 'http://localhost:3000/api/v1/cart';

  private cartStateSubject = new BehaviorSubject<CartState | null>(null);
  public cartState$ = this.cartStateSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialCart();
  }

  private getSessionId(): string {
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  loadInitialCart(): void {
    const sessionId = this.getSessionId();
    const params = new HttpParams().set('sessionId', sessionId);

    this.http.get<ApiResponse<CartState>>(this.baseUrl, { params }).pipe(
      map(response => response.data),
      catchError(() => of(null))
    ).subscribe(cart => {
      this.cartStateSubject.next(cart);
    });
  }

    private handleCartUpdate(request: Observable<ApiResponse<CartState>>): Observable<CartState> {
    return request.pipe(
      tap(response => {
        if (response && response.success) {
          this.cartStateSubject.next(response.data);
        }
      }),
      map(response => response.data)
    );
  }

  getCart(): Observable<CartState> {
    const sessionId = this.getSessionId();
    const params = new HttpParams().set('sessionId', sessionId);
    return this.http.get<ApiResponse<CartState>>(this.baseUrl, { params }).pipe(
      map(response => response.data)
    );
  }

  getSummary(): Observable<any> {
    const sessionId = this.getSessionId();
    const params = new HttpParams().set('sessionId', sessionId);
    return this.http.get(`${this.baseUrl}/summary`, { params });
  }

  addItem(productId: string, quantity: number): Observable<CartState> {
    const sessionId = this.getSessionId();
    const request = this.http.post<ApiResponse<CartState>>(`${this.baseUrl}/items`, {
      productId,
      quantity,
      sessionId
    });
    return this.handleCartUpdate(request);
  }

    updateItem(itemId: string, quantity: number): Observable<CartState> {
    const sessionId = this.getSessionId();
    const request = this.http.put<ApiResponse<CartState>>(`${this.baseUrl}/items/${itemId}`, {
      quantity,
      sessionId
    });
    return this.handleCartUpdate(request);
  }

  removeItem(itemId: string): Observable<CartState> {
    const sessionId = this.getSessionId();
    const params = new HttpParams().set('sessionId', sessionId);
    const request = this.http.delete<ApiResponse<CartState>>(`${this.baseUrl}/items/${itemId}`, { params });
    return this.handleCartUpdate(request);
  }

  clearCart(): Observable<CartState> {
    const sessionId = this.getSessionId();
    const params = new HttpParams().set('sessionId', sessionId);
    const request = this.http.delete<ApiResponse<CartState>>(`${this.baseUrl}/clear`, { params });
    return this.handleCartUpdate(request);
  }

  applyCoupon(code: string): Observable<CartState> {
    const sessionId = this.getSessionId();
    const request = this.http.post<ApiResponse<CartState>>(`${this.baseUrl}/coupon`, { couponCode: code, sessionId });
    return this.handleCartUpdate(request);
  }

  removeCoupon(): Observable<CartState> {
    const sessionId = this.getSessionId();
    const params = new HttpParams().set('sessionId', sessionId);
    const request = this.http.delete<ApiResponse<CartState>>(`${this.baseUrl}/coupon`, { params });
    return this.handleCartUpdate(request);
  }

  validateCart(): Observable<any> {
    const sessionId = this.getSessionId();
    return this.http.post(`${this.baseUrl}/validate`, { sessionId });
  }

    mergeCart(guestCartId: string, strategy: 'merge' | 'replace'): Observable<CartState> {
    const request = this.http.post<ApiResponse<CartState>>(`${this.baseUrl}/merge`, {
      guestCartId,
      mergeStrategy: strategy
    });
    return this.handleCartUpdate(request);
  }
}
