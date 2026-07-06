import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAltaUsuario } from './modal-alta-usuario';

describe('ModalAltaUsuario', () => {
  let component: ModalAltaUsuario;
  let fixture: ComponentFixture<ModalAltaUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAltaUsuario],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalAltaUsuario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
