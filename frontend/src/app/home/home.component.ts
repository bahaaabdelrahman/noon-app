import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  title = 'MyNoonApp';
  currentLang = 'ar';

  @ViewChild('categoriesWrapper') categoriesWrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('productCarousel') productCarousel!: ElementRef;
  @ViewChild('brandCarousel', { static: false }) brandCarousel!: ElementRef;


  brands = [
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




  showLeftArrow = false;
  showRightArrow = false;
  private scrollAmount = 350;
  private resizeObserver?: ResizeObserver;
  private isRtl = false;
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private translate: TranslateService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.translate) {
      this.translate.setDefaultLang('ar');
      this.translate.use('ar');

      // ✅ فقط إذا كنا في المتصفح
      if (this.isBrowser) {
        this.setDirection(this.currentLang);
      }
    } else {
      console.warn('TranslateService is undefined!');
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.isRtl = getComputedStyle(document.documentElement).direction === 'rtl';

      this.resizeObserver = new ResizeObserver(() => {
        this.updateArrows();
      });

      this.resizeObserver.observe(this.categoriesWrapper.nativeElement);
      this.updateArrows();
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.resizeObserver?.disconnect();
    }
  }

  private updateArrows(): void {
    if (!this.isBrowser) return;

    const wrapper = this.categoriesWrapper?.nativeElement;
    if (!wrapper) return;

    const scrollLeft = this.isRtl
      ? Math.abs(wrapper.scrollLeft)
      : wrapper.scrollLeft;

    const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;

    this.showLeftArrow = scrollLeft > 5;
    this.showRightArrow = scrollLeft < maxScroll - 5;
  }

  scrollRight(): void {
    if (!this.isBrowser) return;

    const wrapper = this.categoriesWrapper.nativeElement;
    const direction = this.isRtl ? -1 : 1;
    wrapper.scrollBy({ left: direction * this.scrollAmount, behavior: 'smooth' });

    setTimeout(() => this.updateArrows(), 400);
  }

  scrollLeft(): void {
    if (!this.isBrowser) return;

    const wrapper = this.categoriesWrapper.nativeElement;
    const direction = this.isRtl ? -1 : 1;
    wrapper.scrollBy({ left: -direction * this.scrollAmount, behavior: 'smooth' });

    setTimeout(() => this.updateArrows(), 400);
  }

  switchLanguage(): void {
    this.currentLang = this.currentLang === 'en' ? 'ar' : 'en';
    this.translate.use(this.currentLang);

    if (this.isBrowser) {
      const dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.body.dir = dir;

      this.isRtl = dir === 'rtl';
      setTimeout(() => this.updateArrows(), 300);
    }
  }

  private setDirection(lang: string): void {
    if (!this.isBrowser) return;

    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.body.dir = dir;
    this.isRtl = dir === 'rtl';
  }


  scrollCarousel(amount: number): void {
    const carouselElement = this.productCarousel.nativeElement as HTMLElement;
    carouselElement.scrollBy({
      left: amount,
      behavior: 'smooth' // لجعل التمرير سلسًا
    });
  }


  scrollBrands(direction: number): void {
    const carouselElement = this.brandCarousel.nativeElement as HTMLElement;
    const scrollAmount = carouselElement.clientWidth;

    carouselElement.scrollBy({
      left: scrollAmount * direction,
      behavior: 'smooth'
    });
  }


  addToCart() {
    console.log('تمت إضافة المنتج إلى السلة');
    // يمكنك استدعاء خدمة لإضافة المنتج فعليًا
  }


}
