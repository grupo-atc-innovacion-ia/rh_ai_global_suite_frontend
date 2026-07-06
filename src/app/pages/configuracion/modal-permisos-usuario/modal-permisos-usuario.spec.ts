import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPermisosUsuario } from './modal-permisos-usuario';

describe('ModalPermisosUsuario', () => {
  let component: ModalPermisosUsuario;
  let fixture: ComponentFixture<ModalPermisosUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalPermisosUsuario],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalPermisosUsuario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
