import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertasKpis } from './alertas-kpis';


describe('AlertasKpis', () => {
  let component: AlertasKpis;
  let fixture: ComponentFixture<AlertasKpis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertasKpis],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertasKpis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
