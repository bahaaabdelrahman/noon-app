// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
// import { forkJoin, Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';
// import { ProductService, Product } from '../services/products.service';
// import { CategoryService, Category } from '../services/category.service';

// @Component({
//   selector: 'app-category-products',
//   templateUrl: './category-products.component.html',
//   styleUrls: ['./category-products.component.css'],
//   standalone: false
// })
// export class CategoryProductsComponent implements OnInit, OnDestroy {

//   productsToDisplay: Product[] = [];
//   categoryName: string = '';
//   isLoading: boolean = true;
//   error: string | null = null;
//   private destroy$ = new Subject<void>();

//   constructor(
//     private route: ActivatedRoute,
//     private productService: ProductService,
//     private categoryService: CategoryService
//   ) { }

//   ngOnInit(): void {
//     this.route.paramMap
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(params => {
//         const slug = params.get('slug');
//         if (slug) {
//           this.loadAndFilterProducts(slug);
//         }
//       });
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   loadAndFilterProducts(slug: string): void {
//     this.isLoading = true;
//     this.error = null;
//     this.productsToDisplay = [];

//     forkJoin({
//       allProducts: this.productService.getProducts(),
//       allCategories: this.categoryService.getHierarchy()
//     })
//     .pipe(takeUntil(this.destroy$))
//     .subscribe({
//       next: ({ allProducts, allCategories }) => {
//         const targetCategory = this.findCategoryBySlug(allCategories, slug);

//         if (!targetCategory) {
//           this.error = "Category not found.";
//           this.isLoading = false;
//           return;
//         }

//         this.categoryName = targetCategory.name;

//         const categoryIds = this.getCategoryIds(targetCategory);

//         this.productsToDisplay = allProducts.filter(product =>
//           product.category && categoryIds.has(product.category._id)
//         );

//         this.isLoading = false;
//       },
//       error: (err) => {
//         console.error('Error loading data:', err);
//         this.error = 'Failed to load products. Please try again later.';
//         this.isLoading = false;
//       }
//     });
//   }

//   private findCategoryBySlug(categories: Category[], slug: string): Category | null {
//     for (const category of categories) {
//       if (category.slug === slug) {
//         return category;
//       }
//       if (category.children && category.children.length > 0) {
//         const found = this.findCategoryBySlug(category.children, slug);
//         if (found) return found;
//       }
//     }
//     return null;
//   }

//   private getCategoryIds(category: Category): Set<string> {
//     const ids = new Set<string>();
//     if (category._id) {
//       ids.add(category._id);
//     }

//     if (category.children && category.children.length > 0) {
//       category.children.forEach(child => {
//         this.getCategoryIds(child).forEach(id => ids.add(id));
//       });
//     }
//     return ids;
//   }
// }
