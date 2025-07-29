import { Product } from '../../../../services/products.service';
import { Component, OnInit } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ProductService } from '../../../../services/products.service';


@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})


export class ProductListComponent implements OnInit {
  public products$!: Observable<Product[]>;
  public error: string | null = null;

  constructor(private productService: ProductService) { }

  ngOnInit(): void {
    this.products$ = this.productService.getProducts().pipe(
      catchError(err => {
        this.error = "Failed to load products. Please try again later.";
        console.error(err);
        return of([]); 
      })
    );
  }
}
