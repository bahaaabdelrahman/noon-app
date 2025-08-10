import { Component, OnInit } from '@angular/core';
import { WishlistService, Product, WishlistItem, WishlistDetailsResponse, Wishlist } from '../services/wishlist.service';
import { of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css'],
  standalone: false
})
export class WishlistComponent implements OnInit {

  products: Product[] = [];
  defaultWishlistId: string | null = null;
  wishlistName = 'My Wishlist';
  loading = true;
  errorMessage = '';

  constructor(private wishlistService: WishlistService) {}

  ngOnInit(): void {
    this.loadWishlistItems();
  }

  loadWishlistItems(): void {
    this.loading = true;
    this.errorMessage = '';

    this.wishlistService.getDefaultWishlist().pipe(
      switchMap((wishlist: Wishlist) => {
        if (wishlist && wishlist._id) {
          this.defaultWishlistId = wishlist._id;
          this.wishlistName = wishlist.name;
          return this.wishlistService.getById(wishlist._id);
        }
        return of(null);
      }),
      map((response: WishlistDetailsResponse | null) => response?.data?.items || []),
      catchError(() => {
        this.errorMessage = 'حدث خطأ أثناء جلب قائمة الأمنيات.';
        return of([]);
      })
    ).subscribe((items: WishlistItem[]) => {
      this.products = items.map(item => item.product).filter(Boolean);
      this.loading = false;
    });
  }

  removeProduct(productId: string): void {
    if (!this.defaultWishlistId) return;

    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      this.wishlistService.removeProduct(this.defaultWishlistId, productId).subscribe({
        next: () => {
          this.products = this.products.filter(p => p._id !== productId);
        },
        error: () => alert('تعذر حذف المنتج.')
      });
    }
  }
}
