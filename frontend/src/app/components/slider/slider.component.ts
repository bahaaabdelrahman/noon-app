import { Component, OnDestroy, OnInit } from '@angular/core';



interface Slide {
  src: string;
  alt: string;
  title: string;
}


@Component({
  selector: 'app-slider',
  standalone: false,
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.css'
})


export class SliderComponent implements OnInit, OnDestroy {

  // 1. تعريف مصفوفة الصور (الحالة)
  slides: Slide[] = [
    { src: 'https://f.nooncdn.com/mpcms/EN0003/assets/1b8d9d04-b908-4bde-9c25-58430134c9e0.png', alt: 'Summer Sale', title: 'عرض الصيف' },
    { src: 'https://f.nooncdn.com/mpcms/EN0003/assets/f73f01ed-1fd9-4941-b083-266981d654a8.png', alt: 'Electronics Deals', title: 'الإلكترونيات' },
    { src: 'https://f.nooncdn.com/mpcms/EN0003/assets/baa84c6f-7521-4ee6-b97d-c82fc7b9b2a0.png', alt: 'New Fashion', title: 'أزياء جديدة' },
    { src: 'https://f.nooncdn.com/mpcms/EN0003/assets/68cf1207-7d1a-46ea-95ce-fdd7a598121d.png', alt: 'New Fashion',title: ''},
    { src: 'https://f.nooncdn.com/mpcms/EN0003/assets/7045b634-1478-4c24-a27b-d8fe7cbf38a2.png', alt: 'New Fashion',title: ''},
    { src: 'https://f.nooncdn.com/mpcms/EN0003/assets/0828f219-f31e-4cc0-b8a7-68884029c35c.png', alt: 'New Fashion',title: ''},
    { src: 'https://f.nooncdn.com/mpcms/EN0003/assets/e317e823-ebf5-41c8-8985-afe8b1c4a216.png', alt: 'New Fashion',title: ''}
  ];

  // 2. متغير لتتبع الصورة الحالية
  currentSlide: number = 0;

  // متغير لتخزين المؤقت الزمني
  private slideInterval: any;

  constructor() { }

  // 3. استخدام OnInit لبدء السلايدر التلقائي عند تحميل المكون
  ngOnInit(): void {
    console.log('SliderComponent initialized');
    this.startAutoSlide();
  }

  // 4. استخدام OnDestroy لإيقاف المؤقت عند إزالة المكون لمنع تسرب الذاكرة
  ngOnDestroy(): void {
    console.log('SliderComponent destroyed');
    this.stopAutoSlide();
  }

  // 5. وظائف التنقل
  next(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.resetInterval();
  }

  prev(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.resetInterval();
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.resetInterval();
  }

  // 6. وظائف التحكم في المؤقت
  private startAutoSlide(): void {
    this.slideInterval = setInterval(() => {
        this.next();
    }, 5000); // تغيير الصورة كل 5 ثوانٍ
  }

  private stopAutoSlide(): void {
    if (this.slideInterval) {
        clearInterval(this.slideInterval);
    }
  }

  private resetInterval(): void {
    this.stopAutoSlide();
    this.startAutoSlide();
  }
}
