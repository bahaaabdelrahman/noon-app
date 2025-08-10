import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';



@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api/v1/products';

  constructor(private http: HttpClient) {}


    getProducts(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        httpParams = httpParams.set(key, params[key]);
      });
    }

    return this.http.get<any>(`${this.apiUrl}`, { params: httpParams }).pipe(
      map(response => response.data || [])
    );
  }

  getProductById(productId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${productId}`);
  }


  searchProducts(query: string, page = 1, limit = 20): Observable<any> {
    return this.http.get(`${this.apiUrl}/search`, {
      params: {
        q: query,
        page,
        limit
      }
    });
  }


  getFeaturedProducts(limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/featured`, {
      params: { limit }
    });
  }


  getBestsellers(limit = 10, timeframe = 'month'): Observable<any> {
    return this.http.get(`${this.apiUrl}/bestsellers`, {
      params: { limit, timeframe }
    });
  }

  getNewArrivals(limit = 10, days = 30): Observable<any> {
    return this.http.get(`${this.apiUrl}/new-arrivals`, {
      params: { limit, days }
    });
  }


  getProductReviews(productId: string, options?: any): Observable<any> {
    let params = new HttpParams();
    if (options) {
      Object.keys(options).forEach(key => {
        params = params.set(key, options[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/${productId}/reviews`, { params });
  }


  addReview(productId: string, reviewData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${productId}/reviews`, reviewData);
  }
}
