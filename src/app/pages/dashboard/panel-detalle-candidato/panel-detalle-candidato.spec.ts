import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelDetalleCandidato } from './panel-detalle-candidato';

describe('PanelDetalleCandidato', () => {
  let component: PanelDetalleCandidato;
  let fixture: ComponentFixture<PanelDetalleCandidato>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelDetalleCandidato],
    }).compileComponents();

    fixture = TestBed.createComponent(PanelDetalleCandidato);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
