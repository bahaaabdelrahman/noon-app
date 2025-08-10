import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { CartService } from '../services/cart.service';
import { LoginDialogComponent } from '../auth/login-dialog/login-dialog.component';
import { Category, CategoryService } from '../services/category.service';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: false
})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('categoriesWrapper') categoriesWrapper!: ElementRef<HTMLDivElement>;

  cartItemCount = 0;
  currentLang = 'ar';
  showLeftArrow = false;
  showRightArrow = true;
  categories$: Observable<Category[]>;

  private cartSubscription!: Subscription;
  private resizeObserver?: ResizeObserver;
  private isBrowser: boolean;
  private isRtl = true;
  private scrollAmount = 350;

  constructor(
    private cartService: CartService,
    private translate: TranslateService,
    public dialog: MatDialog,
    private categoryService: CategoryService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.categories$ = this.categoryService.getHierarchy();
  }

  ngOnInit(): void {

    this.cartSubscription = this.cartService.cartState$.subscribe(cartState => {
      this.cartItemCount = cartState?.totalQuantity || 0;
    });

    if (this.translate) {
      this.translate.setDefaultLang('ar');
      this.translate.use('ar');
      if (this.isBrowser) {
        this.setDirection(this.currentLang);
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser && this.categoriesWrapper) {
      this.updateArrows();
      this.resizeObserver = new ResizeObserver(() => this.updateArrows());
      this.resizeObserver.observe(this.categoriesWrapper.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  openLoginDialog(): void {
    this.dialog.open(LoginDialogComponent, {
      width: '450px',
    });
  }

  switchLanguage(): void {
    this.currentLang = this.currentLang === 'en' ? 'ar' : 'en';
    this.translate.use(this.currentLang);
    if (this.isBrowser) {
      this.setDirection(this.currentLang);
      setTimeout(() => this.updateArrows(), 300);
    }
  }

  scrollRight(): void {
    if (!this.isBrowser || !this.categoriesWrapper) return;
    const wrapper = this.categoriesWrapper.nativeElement;
    const direction = this.isRtl ? -1 : 1;
    wrapper.scrollBy({ left: direction * this.scrollAmount, behavior: 'smooth' });
  }

  scrollLeft(): void {
    if (!this.isBrowser || !this.categoriesWrapper) return;
    const wrapper = this.categoriesWrapper.nativeElement;
    const direction = this.isRtl ? -1 : 1;
    wrapper.scrollBy({ left: -direction * this.scrollAmount, behavior: 'smooth' });
  }

  onCategoriesScroll(): void {
    setTimeout(() => this.updateArrows(), 150);
  }

  private updateArrows(): void {
    if (!this.isBrowser || !this.categoriesWrapper) return;
    const wrapper = this.categoriesWrapper.nativeElement;
    const scrollLeft = Math.abs(wrapper.scrollLeft);
    const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;

    this.showLeftArrow = scrollLeft > 1;
    this.showRightArrow = scrollLeft < maxScroll - 1;
  }

  private setDirection(lang: string): void {
    if (this.isBrowser) {
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.body.dir = dir;
      this.isRtl = dir === 'rtl';
    }
  }
}
