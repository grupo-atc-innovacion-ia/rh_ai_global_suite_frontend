import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministrarVacantesComponent } from './administrar-vacantes';

describe('AdministrarVacantesComponent', () => {
  let component: AdministrarVacantesComponent;
  let fixture: ComponentFixture<AdministrarVacantesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministrarVacantesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdministrarVacantesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
