import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, map, shareReplay } from 'rxjs/operators';

export interface Product {
  _id: string;
  name: string;
  coverImage?: string;
  price: number;
  mainImage?: {
    url?: string;
  };
}

export interface WishlistItem {
  product: Product;
}

export interface Wishlist {
  _id: string;
  name: string;
  isDefault?: boolean;
  description?: string;
  privacy?: 'private' | 'public' | 'shared';
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WishlistsResponse {
  success: boolean;
  data: {
    wishlists: Wishlist[];
  };
}

export interface WishlistDetails {
  _id: string;
  name: string;
  items: WishlistItem[];
}

export interface CreateWishlistResponse {
  success: boolean;
  data: Wishlist;
}

export interface WishlistDetailsResponse {
  success: boolean;
  data: WishlistDetails;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private baseUrl = 'http://localhost:3000/api/v1/wishlists';
  private defaultWishlist$: Observable<Wishlist> | null = null;

  constructor(private http: HttpClient) {}

  public addProductToDefaultWishlist(productId: string): Observable<any> {
    return this.getDefaultWishlist().pipe(
      switchMap(wishlist => {
        return this.addProduct(wishlist._id, productId);
      })
    );
  }

  public getDefaultWishlist(): Observable<Wishlist> {
    if (!this.defaultWishlist$) {
      this.defaultWishlist$ = this.getAll().pipe(
        switchMap((response: WishlistsResponse) => {
          const wishlists = response?.data?.wishlists || [];
          const defaultWishlist = wishlists.find(w => w.isDefault || w.name === 'My Wishlist');

          if (defaultWishlist) {
            return of(defaultWishlist);
          } else {
            return this.create({ name: 'My Wishlist', isDefault: true, privacy: 'private' }).pipe(
              map((createResponse: CreateWishlistResponse) => createResponse.data)
            );
          }
        }),
        shareReplay(1)
      );
    }
    return this.defaultWishlist$;
  }

  getAll(page = 1, limit = 10, sortOrder: 'asc' | 'desc' = 'desc'): Observable<WishlistsResponse> {
    return this.http.get<WishlistsResponse>(`${this.baseUrl}?page=${page}&limit=${limit}&sortOrder=${sortOrder}`);
  }

  getById(id: string): Observable<WishlistDetailsResponse> {
    return this.http.get<WishlistDetailsResponse>(`${this.baseUrl}/${id}`);
  }

  create(data: Partial<Wishlist>): Observable<CreateWishlistResponse> {
    return this.http.post<CreateWishlistResponse>(this.baseUrl, data);
  }

  update(id: string, data: Partial<Wishlist>): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  addProduct(wishlistId: string, productId: string, notes?: string, priority?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${wishlistId}/products/${productId}`, { notes, priority });
  }

  removeProduct(wishlistId: string, productId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${wishlistId}/products/${productId}`);
  }

  clear(wishlistId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${wishlistId}/clear`);
  }

  moveToCart(wishlistId: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${wishlistId}/move-to-cart`, data);
  }

  share(wishlistId: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${wishlistId}/share`, data);
  }

  getShared(shareToken: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/shared/${shareToken}`);
  }
}
