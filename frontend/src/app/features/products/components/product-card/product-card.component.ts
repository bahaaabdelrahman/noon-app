// src/app/features/products/components/product-card/product-card.component.ts

import { Component, Input } from '@angular/core';
import { Product } from '../../services/product.service';


@Component({
  selector: 'app-product-card',
  standalone: false,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})


export class ProductCardComponent {
  // (1) استقبال بيانات المنتج من المكون الأب
  @Input() product!: Product;

  addToCart(product: Product) {
    // (2) منطق إضافة المنتج للسلة سيأتي لاحقاً
    console.log('Added to cart:', product.title);
  }
}
