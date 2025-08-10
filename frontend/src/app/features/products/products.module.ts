import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsRoutingModule } from './products-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    ProductsRoutingModule,
    SharedModule ,
    TranslateModule
  ] ,
  exports: [

  ],
})
export class ProductsModule { }
