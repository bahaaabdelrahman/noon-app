import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductService } from '../services/products.service';
import { Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false
})
export class HomeComponent implements OnInit {
  public products$!: Observable<any[]>;
  public productsError: string | null = null;
  public productImageIndexes: { [productId: string]: number } = {};

  @ViewChild('productCarousel') productCarousel!: ElementRef;
  @ViewChild('brandCarousel') brandCarousel!: ElementRef;

  public brands = [
    { name: 'Samsung', logo: 'https://f.nooncdn.com/mpcms/EN0003/assets/966d8c9a-3ba7-4c86-96e1-f7894feff150.png', link: '#' },
    { name: 'Apple', logo: 'https://f.nooncdn.com/mpcms/EN0003/assets/62a483ad-e49a-49aa-9cad-0d7911171ead.png', link: '#' },
    { name: 'Xiaomi', logo: 'https://f.nooncdn.com/mpcms/EN0003/assets/794acd05-84ce-4215-808f-685d8aacd4e2.png', link: '#' },
    { name: 'Toshiba', logo: 'https://f.nooncdn.com/mpcms/EN0003/assets/e46c5eff-d520-4389-917f-b17f72a3e3b1.png', link: '#' },
    { name: 'Lenovo', logo: 'https://f.nooncdn.com/mpcms/EN0003/assets/76ddd373-8914-457e-838a-a1c8b8f06229.png', link: '#' },
    { name: 'HP', logo: 'https://f.nooncdn.com/mpcms/EN0003/assets/86e7e24c-224c-43df-8c96-47a52ac3ff2b.png', link: '#' },
    { name: 'Sony', logo: 'https://f.nooncdn.com/mpcms/EN0003/assets/f9976c1e-0c39-48b8-9037-578b984f755b.png', link: '#' },
    { name: 'LG', logo: 'https://f.nooncdn.com/mpcms/EN0003/assets/5abbc608-d9f2-4ad5-ac93-6b2bf1f12bd8.png', link: '#' },
    { name: 'Huawei', logo: 'https://f.nooncdn.com/mpcms/EN0003/assets/b874e82f-2158-43c7-89a9-5f3d390b4c04.png', link: '#' },
    { name: 'Dell', logo: 'https://f.nooncdn.com/mpcms/EN0003/assets/5ebec77c-db8f-4a19-b85c-1ff58ae977c0.png', link: '#' },
    { name: 'Asus', logo: 'https://f.nooncdn.com/mpcms/EN0003/assets/d5b2fbf8-7472-4407-aefc-e5c6ea33c732.png', link: '#' },
    { name: 'Nokia', logo: 'https://f.nooncdn.com/mpcms/EN0003/assets/89fd76d8-c7f5-4366-b65a-93c488a64595.png', link: '#' },
  ];

  constructor(
    private productService: ProductService,
    private router: Router,
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.products$ = this.productService.getProducts().pipe(
      catchError(err => {
        console.error('Failed to load products:', err);
        this.productsError = 'Failed to load products.';
        return of([]);
      })
    );
  }

  addToCart(product: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
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

  scrollCarousel(amount: number): void {
    if (this.productCarousel) {
      this.productCarousel.nativeElement.scrollBy({ left: amount, behavior: 'smooth' });
    }
  }

  scrollBrands(direction: number): void {
    if (this.brandCarousel) {
      const scrollAmount = this.brandCarousel.nativeElement.clientWidth;
      this.brandCarousel.nativeElement.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
    }
  }

  getCurrentImage(product: any): string {
    const index = this.productImageIndexes[product._id] ?? 0;
    return product.images?.[index]?.url || product.mainImage?.url;
  }

  nextImage(product: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const images = product.images || [];
    if (images.length <= 1) return;
    const current = this.productImageIndexes[product._id] ?? 0;
    this.productImageIndexes[product._id] = (current + 1) % images.length;
  }

  prevImage(product: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const images = product.images || [];
    if (images.length <= 1) return;
    const current = this.productImageIndexes[product._id] ?? 0;
    this.productImageIndexes[product._id] = (current - 1 + images.length) % images.length;
  }

  goToProduct(id: string): void {
    if (id) {
      this.router.navigate(['/product', id]);
    } else {
      console.error('Product ID is missing, cannot navigate.');
    }
  }
}
