import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private baseUrl = 'http://localhost:3000/api/v1/cart';

  constructor(private http: HttpClient) {}

  getCart(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }

  getSummary(): Observable<any> {
    return this.http.get(`${this.baseUrl}/summary`);
  }

  addItem(productId: string, quantity: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/items`, { productId, quantity });
  }

  updateItem(itemId: string, quantity: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/items/${itemId}`, { quantity });
  }

  removeItem(itemId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/items/${itemId}`);
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/clear`);
  }

  applyCoupon(code: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/coupon`, { couponCode: code });
  }

  removeCoupon(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/coupon`);
  }

  validateCart(): Observable<any> {
    return this.http.post(`${this.baseUrl}/validate`, {});
  }

  mergeCart(guestCartId: string, strategy: 'merge' | 'replace'): Observable<any> {
    return this.http.post(`${this.baseUrl}/merge`, {
      guestCartId,
      mergeStrategy: strategy
    });
  }
}
