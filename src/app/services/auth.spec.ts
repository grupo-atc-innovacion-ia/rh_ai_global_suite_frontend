import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing'; // Importante para que la prueba no truene por el uso de APIs

import { AuthService } from './auth'; // <-- Corregido a AuthService

describe('AuthService', () => {
  let service: AuthService; // <-- Corregido a AuthService

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule] // Le proveemos un entorno HTTP falso para pruebas
    });
    service = TestBed.inject(AuthService); // <-- Corregido a AuthService
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});