import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalModificarUsuario } from './modal-modificar-usuario';

describe('ModalModificarUsuario', () => {
  let component: ModalModificarUsuario;
  let fixture: ComponentFixture<ModalModificarUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalModificarUsuario],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalModificarUsuario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
