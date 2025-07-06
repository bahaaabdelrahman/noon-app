// src/app/features/products/products-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from './pages/product-list/product-list.component';



const routes: Routes = [
  { path: '', component: ProductListComponent } // المسار الفارغ داخل الوحدة يعرض القائمة
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule { }
