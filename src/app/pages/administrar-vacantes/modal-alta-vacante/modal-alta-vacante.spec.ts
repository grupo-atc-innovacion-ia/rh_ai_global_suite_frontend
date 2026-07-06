import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalAltaVacanteComponent } from './modal-alta-vacante';

describe('ModalAltaVacanteComponent', () => {
  let component: ModalAltaVacanteComponent;
  let fixture: ComponentFixture<ModalAltaVacanteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAltaVacanteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalAltaVacanteComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
