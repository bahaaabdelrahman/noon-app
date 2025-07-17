import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../auth.service';

// دالة مخصصة للتحقق من تطابق كلمتي المرور
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  // إذا لم يتم إدخال أي منهما، لا تقم بالتحقق
  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-login-dialog',
  templateUrl: './login-dialog.component.html',
  styleUrls: ['./login-dialog.component.css'],
  standalone: false
})
export class LoginDialogComponent {
  activeTab: 'login' | 'register' = 'login';
  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<LoginDialogComponent>,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    // بناء النموذج مع جميع الحقول المحتملة
    this.loginForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],

      // هذا النمط يتأكد من وجود حرف صغير، كبير، رقم، ورمز خاص واحد على الأقل
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+)/)
      ]],
      confirmPassword: [''] // سنضيف validator هنا ديناميكيًا
    }, {
      // validators: passwordMatchValidator
    });

    // استدعاء switchTab لضبط الحالة الأولية (login) بشكل صحيح
    this.switchTab('login');
  }

   switchTab(tab: 'login' | 'register'): void {
  this.activeTab = tab;
  this.errorMessage = null;
  this.loginForm.reset(); // نبدأ من حالة نظيفة

  // الحصول على الحقول
  const firstName = this.loginForm.get('firstName');
  const lastName = this.loginForm.get('lastName');
  const password = this.loginForm.get('password');
  const confirmPassword = this.loginForm.get('confirmPassword');

  // التأكد من وجود الحقول
  if (!firstName || !lastName || !password || !confirmPassword) {
    return;
  }

  // أولاً، قم بمسح جميع الـ validators من النموذج ككل ومن الحقول
  this.loginForm.clearValidators();
  firstName.clearValidators();
  lastName.clearValidators();
  password.clearValidators();
  confirmPassword.clearValidators();

  // قم بتعطيل الحقول التي قد لا نحتاجها
  firstName.disable();
  lastName.disable();
  confirmPassword.disable();


  if (tab === 'register') {
    // --- حالة التسجيل ---
    // 1. تفعيل الحقول المطلوبة
    firstName.enable();
    lastName.enable();
    confirmPassword.enable();

    // 2. إضافة قواعد التحقق للحقول
    firstName.setValidators([Validators.required]);
    lastName.setValidators([Validators.required]);
    password.setValidators([
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
    ]);
    confirmPassword.setValidators([Validators.required]);

    // 3. إضافة قاعدة التحقق من تطابق كلمة المرور على مستوى النموذج
    this.loginForm.setValidators(passwordMatchValidator);

  } else {
    password.setValidators([Validators.required]);
  }

  // أعد تفعيل حقل البريد الإلكتروني لأنه مطلوب في كلتا الحالتين
  this.loginForm.get('email')?.enable();
  this.loginForm.get('email')?.setValidators([Validators.required, Validators.email]);

  // تحديث صلاحية النموذج بالكامل في النهاية
  this.loginForm.updateValueAndValidity();
}

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // التحقق من خطأ عدم تطابق كلمة المرور يدويًا لعرض رسالة واضحة
      if (this.loginForm.hasError('passwordMismatch')) {
        this.errorMessage = 'كلمتا المرور غير متطابقتين.';
      }
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    if (this.activeTab === 'login') {
          const { email, password } = this.loginForm.value;

    // (1) إنشاء كائن البيانات بالاسم الصحيح الذي يتوقعه الخادم
    const credentials = { email, password };

    // (2) استدعاء خدمة تسجيل الدخول بالبيانات الصحيحة
    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'فشل تسجيل الدخول. البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        this.isLoading = false;
      }
    });
    } else {

    const { firstName, lastName, email, password, confirmPassword } = this.loginForm.value;

    const registrationData = {
      firstName,
      lastName,
      email,
      password,
      confirmPassword
    };


    this.authService.register(registrationData).subscribe({
      next: (response) => {
        console.log('Registration successful', response);
        this.dialogRef.close(true);
      },
      error: (err) => {
        if (err.error?.details && Array.isArray(err.error.details)) {
          this.errorMessage = err.error.details.map((e: any) => e.message).join('. ');
        } else {
          this.errorMessage = err.error?.message || 'فشل التسجيل. يرجى المحاولة مرة أخرى.';
        }
        this.isLoading = false;
      }
    });

    }
  }
}
