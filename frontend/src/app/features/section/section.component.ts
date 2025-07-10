import { Component, ViewChild, ElementRef  } from '@angular/core';

@Component({
  selector: 'app-section',
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.css'],
  standalone: false
})


export class SectionComponent {


  @ViewChild('brandSlider', { static: false }) brandSlider!: ElementRef;





  sections = [
    { title: 'الإلكترونيات' },
    { title: 'الموضة' },
    { title: 'المنزل' },
    { title: 'الجمال' },
    { title: 'الأطفال' },
    { title: 'الرياضة' },
    { title: 'البقالة' },
    { title: 'السيارات' },
    { title: 'الهواتف' },
    { title: 'الألعاب' },
    { title: 'الكتب' },
    { title: 'العروض اليومية' },
    { title: 'الصحة' }
  ];

  // يمكنك استخدام نفس الصور لكل الأقسام أو تخصيصها لاحقًا
  images: string[] = [
    'https://f.nooncdn.com/mpcms/EN0003/assets/e82e1cdf-9bb0-4438-86c2-ab716fd126ac.png',
    'https://f.nooncdn.com/mpcms/EN0003/assets/bd300f43-609b-4460-b591-a5823a4d0d22.png',
    'https://f.nooncdn.com/mpcms/EN0003/assets/ddc6adbd-5aa5-41f2-b826-d1ec3caa842f.png',
    'https://f.nooncdn.com/mpcms/EN0003/assets/47a8b7c1-07f6-4da2-8203-5909842fad7d.png',
    'https://f.nooncdn.com/mpcms/EN0003/assets/47f3f5a7-12ce-4885-b0f3-6d2e67b289a8.png',
    'https://f.nooncdn.com/mpcms/EN0003/assets/6193a251-2d62-40b2-ae6a-eb2d8208f616.png',
    'https://f.nooncdn.com/mpcms/EN0003/assets/673f6695-196c-45f5-9b9f-82698c52cecb.png'
  ];


  // شوف فئات تانيه
  otherCategories = [
    { img: 'https://f.nooncdn.com/mpcms/EN0003/assets/c92819ed-9232-4039-8e9f-a388ba6351f1.png' },
    { img: 'https://f.nooncdn.com/mpcms/EN0003/assets/b19fef53-6f55-4ce7-ab1e-1eb0b365ce30.png' },
    { img: 'https://f.nooncdn.com/mpcms/EN0003/assets/4157e442-4aff-4631-9c0f-f7b46ca48e38.png' },
    { img: 'https://f.nooncdn.com/mpcms/EN0003/assets/b27bd0b9-e606-4e25-9871-1eb862aeb9aa.png' },
    { img: 'https://f.nooncdn.com/mpcms/EN0003/assets/d42fa707-dbbf-455f-a198-e5effa14db11.png' }
  ];


  // قسم ماركات تحبها
  brands: string[][] = [
    [
      'https://f.nooncdn.com/mpcms/EN0003/assets/d560417a-ed0d-4319-ba4b-768962fb5495.png',
      'https://f.nooncdn.com/mpcms/EN0003/assets/75220237-12af-4db0-9952-f0de9de2f482.png',
      'https://f.nooncdn.com/mpcms/EN0003/assets/d320baec-2c4e-45a3-bb6e-526c6b16cc2f.png',
    ],
    [
      'https://f.nooncdn.com/mpcms/EN0003/assets/24978080-ed56-4580-9b6b-86e8ae753bb8.png',
      'https://f.nooncdn.com/mpcms/EN0003/assets/5da71607-a2a6-409e-9e41-d159fb5b9936.png',
      'https://f.nooncdn.com/mpcms/EN0003/assets/5da71607-a2a6-409e-9e41-d159fb5b9936.png',
    ],
    [
      'https://f.nooncdn.com/mpcms/EN0003/assets/24978080-ed56-4580-9b6b-86e8ae753bb8.png',
      'https://f.nooncdn.com/mpcms/EN0003/assets/5da71607-a2a6-409e-9e41-d159fb5b9936.png',
      'https://f.nooncdn.com/mpcms/EN0003/assets/5da71607-a2a6-409e-9e41-d159fb5b9936.png',
    ],
    [
      'https://f.nooncdn.com/mpcms/EN0003/assets/24978080-ed56-4580-9b6b-86e8ae753bb8.png',
      'https://f.nooncdn.com/mpcms/EN0003/assets/5da71607-a2a6-409e-9e41-d159fb5b9936.png',
      'https://f.nooncdn.com/mpcms/EN0003/assets/5da71607-a2a6-409e-9e41-d159fb5b9936.png',
    ],
    [
      'https://f.nooncdn.com/mpcms/EN0003/assets/24978080-ed56-4580-9b6b-86e8ae753bb8.png',
      'https://f.nooncdn.com/mpcms/EN0003/assets/5da71607-a2a6-409e-9e41-d159fb5b9936.png',
      'https://f.nooncdn.com/mpcms/EN0003/assets/5da71607-a2a6-409e-9e41-d159fb5b9936.png',
    ],
    [
      'https://f.nooncdn.com/mpcms/EN0003/assets/24978080-ed56-4580-9b6b-86e8ae753bb8.png',
      'https://f.nooncdn.com/mpcms/EN0003/assets/5da71607-a2a6-409e-9e41-d159fb5b9936.png',
      'https://f.nooncdn.com/mpcms/EN0003/assets/5da71607-a2a6-409e-9e41-d159fb5b9936.png',
    ],
    [
      'https://f.nooncdn.com/mpcms/EN0003/assets/24978080-ed56-4580-9b6b-86e8ae753bb8.png',
      'https://f.nooncdn.com/mpcms/EN0003/assets/5da71607-a2a6-409e-9e41-d159fb5b9936.png',
      'https://f.nooncdn.com/mpcms/EN0003/assets/5da71607-a2a6-409e-9e41-d159fb5b9936.png',
    ],
  ];


  scrollLeft() {
    this.brandSlider.nativeElement.scrollBy({ left: -200, behavior: 'smooth' });
  }

  scrollRight() {
    this.brandSlider.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
  }







}
