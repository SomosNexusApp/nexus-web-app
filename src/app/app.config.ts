import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http'; // <--- IMPRESCINDIBLE

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),      // 1. Activa las rutas
    provideHttpClient(withFetch()) // 2. Activa la conexión a Spring Boot
  ]
};