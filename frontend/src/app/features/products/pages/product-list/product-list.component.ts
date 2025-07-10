// src/app/features/products/pages/product-list/product-list.component.ts

import { Component, OnInit } from '@angular/core';
import { Product, ProductService } from '../../services/product.service';
import { Observable, catchError, of } from 'rxjs';


@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})


export class ProductListComponent implements OnInit {
  // (1) سنستخدم async pipe، لذلك نوع المتغير سيكون Observable
  public products$!: Observable<Product[]>;
  public error: string | null = null;

  constructor(private productService: ProductService) { }

  ngOnInit(): void {
    this.products$ = this.productService.getProducts().pipe(
      catchError(err => {
        // (2) التعامل مع الأخطاء
        this.error = "Failed to load products. Please try again later.";
        console.error(err);
        return of([]); // إرجاع مصفوفة فارغة لتجنب كسر التطبيق
      })
    );
  }
}
