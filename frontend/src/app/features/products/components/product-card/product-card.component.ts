import { Component, Input } from '@angular/core';
import { Product } from '../../../../services/products.service'; 

@Component({
  selector: 'app-product-card',
  standalone: false,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  @Input() product!: Product;

  addToCart(product: Product) {
    console.log('Added to cart:', product.title);
  }
}
