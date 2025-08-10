import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

import { CartService, CartState } from '../services/cart.service';
import { WishlistService } from '../services/wishlist.service'; // <-- الخطوة 1: استيراد WishlistService

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  standalone: false
})
export class CartComponent implements OnInit {

  public cartState$!: Observable<CartState | null>;
  private quantityUpdateSubject = new Subject<{ itemId: string, quantity: number }>();

  constructor(
    private cartService: CartService,
    private wishlistService: WishlistService, 
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartState$ = this.cartService.cartState$;

    this.quantityUpdateSubject.pipe(
      debounceTime(500),
      distinctUntilChanged((prev, curr) => prev.quantity === curr.quantity && prev.itemId === curr.itemId)
    ).subscribe(update => {
      this.cartService.updateItem(update.itemId, update.quantity).subscribe({
        error: () => this.snackBar.open('Error updating quantity', 'Close', { duration: 2000 })
      });
    });
  }

  removeItem(itemId: string, showNotification: boolean = true): void {
    this.cartService.removeItem(itemId).subscribe({
      next: () => {
        if (showNotification) {
          this.snackBar.open('Product removed from cart', 'Close', { duration: 2000, verticalPosition: 'top' });
        }
      },
      error: () => {
        if (showNotification) {
          this.snackBar.open('Error removing product', 'Close', { duration: 2000, verticalPosition: 'top' });
        }
      }
    });
  }

  updateQuantity(itemId: string, newQuantity: number): void {
    if (newQuantity < 1) {
      this.removeItem(itemId);
      return;
    }
    this.quantityUpdateSubject.next({ itemId, quantity: newQuantity });
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe({
      next: () => this.snackBar.open('Cart cleared successfully', 'Close', { duration: 2000, verticalPosition: 'top' }),
      error: () => this.snackBar.open('Error clearing cart', 'Close', { duration: 2000, verticalPosition: 'top' })
    });
  }

  addToWishlist(productId: string, cartItemId: string): void {
    if (!productId) {
      this.snackBar.open('Cannot find product to add.', 'Close', { duration: 3000 });
      return;
    }

    this.wishlistService.getDefaultWishlist().pipe(
      switchMap(wishlist => {
        if (wishlist && wishlist._id) {
          return this.wishlistService.addProduct(wishlist._id, productId);
        } else {
          this.snackBar.open('No default wishlist found.', 'Close', { duration: 3000 });
          return of(null);
        }
      }),
      catchError(error => {
        this.snackBar.open('Error adding product to wishlist', 'Close', { duration: 3000, verticalPosition: 'top' });
        console.error(error);
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.snackBar.open('Product moved to wishlist', 'Close', { duration: 2000, verticalPosition: 'top' });
        this.removeItem(cartItemId, false);
      }
    });
  }
}
