import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../auth.service';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (!password || !confirmPassword) return null;
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
    this.loginForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+)/)
      ]],
      confirmPassword: ['']
    });
    this.switchTab('login');
  }

  switchTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.errorMessage = null;
    this.loginForm.reset();

    const firstName = this.loginForm.get('firstName');
    const lastName = this.loginForm.get('lastName');
    const password = this.loginForm.get('password');
    const confirmPassword = this.loginForm.get('confirmPassword');

    if (!firstName || !lastName || !password || !confirmPassword) return;

    this.loginForm.clearValidators();
    firstName.clearValidators();
    lastName.clearValidators();
    password.clearValidators();
    confirmPassword.clearValidators();

    firstName.disable();
    lastName.disable();
    confirmPassword.disable();

    if (tab === 'register') {
      firstName.enable();
      lastName.enable();
      confirmPassword.enable();

      firstName.setValidators([Validators.required]);
      lastName.setValidators([Validators.required]);
      password.setValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
      ]);
      confirmPassword.setValidators([Validators.required]);
      this.loginForm.setValidators(passwordMatchValidator);
    } else {
      password.setValidators([Validators.required]);
    }

    this.loginForm.get('email')?.enable();
    this.loginForm.get('email')?.setValidators([Validators.required, Validators.email]);
    this.loginForm.updateValueAndValidity();
  }

  // في ملف login-dialog.component.ts

onSubmit(): void {
  if (this.loginForm.invalid) {
    if (this.loginForm.hasError('passwordMismatch')) {
      this.errorMessage = 'Passwords do not match.';
    }
    return;
  }

  this.isLoading = true;
  this.errorMessage = null;

  if (this.activeTab === 'login') {
    const { email, password } = this.loginForm.value;
    const credentials = { email, password };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login successful, token saved. Reloading page to sync auth state...');

        this.dialogRef.close(true);
        window.location.reload();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Login failed. Incorrect email or password.';
        this.isLoading = false;
      }
    });
  } else {
    const { firstName, lastName, email, password, confirmPassword } = this.loginForm.value;
    const registrationData = { firstName, lastName, email, password, confirmPassword };

    this.authService.register(registrationData).subscribe({
      next: (response) => {
        console.log('Registration successful. Reloading page...');
        this.dialogRef.close(true);
        window.location.reload();
      },
      error: (err) => {
        if (err.error?.details && Array.isArray(err.error.details)) {
          this.errorMessage = err.error.details.map((e: any) => e.message).join('. ');
        } else {
          this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
        }
        this.isLoading = false;
      }
    });
  }
}
}
