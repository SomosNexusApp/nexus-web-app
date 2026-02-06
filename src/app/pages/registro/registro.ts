import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registro.html',
  styleUrls: ['./registro.css']
})
export class RegistroComponent {
  paso: 'datos' | 'verificacion' = 'datos';
  
  usuario = {
    user: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    ubicacion: ''
  };
  
  codigoVerificacion = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  registrar() {
    // Validaciones
    if (!this.usuario.user || !this.usuario.email || !this.usuario.password) {
      this.errorMessage = 'Completa todos los campos obligatorios';
      return;
    }

    if (this.usuario.password !== this.usuario.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    if (this.usuario.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.usuario).subscribe({
      next: (response) => {
        console.log('Registro exitoso:', response);
        this.paso = 'verificacion';
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage = error.error?.mensaje || 'Error en el registro';
        this.isLoading = false;
      }
    });
  }

  verificar() {
    if (!this.codigoVerificacion || this.codigoVerificacion.length !== 6) {
      this.errorMessage = 'Introduce un código válido de 6 dígitos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verify(this.usuario.email, this.codigoVerificacion).subscribe({
      next: () => {
        alert('¡Cuenta verificada! Ahora puedes iniciar sesión');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error:', error);
        this.errorMessage = 'Código incorrecto o expirado';
        this.isLoading = false;
      }
    });
  }
}