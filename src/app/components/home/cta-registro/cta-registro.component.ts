import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth-store';

@Component({
  selector: 'app-cta-registro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cta-registro.component.html',
  styleUrls: ['./cta-registro.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtaRegistroComponent {
  private router = inject(Router);
  protected authStore = inject(AuthStore);

  goRegister() {
    this.router.navigate(['/register']);
  }
  goLogin() {
    this.router.navigate(['/login']);
  }
}
