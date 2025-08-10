import { Component, ElementRef, OnInit, ViewChild, PLATFORM_ID, Inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { ProductService } from '../services/products.service';
import { TranslateService } from '@ngx-translate/core';
import { isPlatformBrowser } from '@angular/common';
import { LoginDialogComponent } from '../auth/login-dialog/login-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { CartService } from '../services/cart.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
  standalone: false
})
export class ProductDetailComponent implements OnInit, OnDestroy {


  public product$!: Observable<any>;
  public error: string | null = null;

  cartItemCount = 0;
  private cartSubscription!: Subscription;


  allImages: string[] = [];
  currentIndex: number = 0;
  selectedImage: string | null = null;
  currentLang = 'ar';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private translate: TranslateService,
    @Inject(PLATFORM_ID) private platformId: Object,
    public dialog: MatDialog,
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {}


  ngOnInit(): void {
    this.product$ = this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const id = params.get('id');
        if (id) {
          return this.productService.getProductById(id).pipe(
            map(response => {
              const product = response.data || null;
              if (product) {
                const gallery = product.images?.map((img: { url: string }) => img.url) || [];
                const main = product.mainImage?.url;
                this.allImages = main ? [main, ...gallery.filter((url: string) => url !== main)] : gallery;
                this.currentIndex = 0;
                this.selectedImage = this.allImages[0] || null;
              }
              return product;
            }),
            catchError(err => {
              console.error('Error loading product:', err);
              this.error = 'Sorry, we could not find the product you are looking for.';
              return of(null);
            })
          );
        }
        this.error = 'Product identifier not found.';
        return of(null);
      })
    );

    this.cartSubscription = this.cartService.cartState$.subscribe(cartState => {
      this.cartItemCount = cartState?.totalQuantity || 0;
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  addToCart(product: any): void {
    if (!product || !product._id) return;
    this.cartService.addItem(product._id, 1).subscribe({
      next: () => {
        this.snackBar.open(`${product.name} تمت إضافته إلى السلة!`, 'إغلاق', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      },
      error: (err) => {
         this.snackBar.open('حدث خطأ أثناء إضافة المنتج.', 'إغلاق', { duration: 3000 });
         console.error('Failed to add item', err);
      }
    });
  }

  selectImage(url: string) {
    this.selectedImage = url;
  }

  prevImage(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.selectedImage = this.allImages[this.currentIndex];
    }
  }

  nextImage(): void {
    if (this.currentIndex < this.allImages.length - 1) {
      this.currentIndex++;
      this.selectedImage = this.allImages[this.currentIndex];
    }
  }
}
