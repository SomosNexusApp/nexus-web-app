import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevaDevolucion } from './nueva-devolucion';

describe('NuevaDevolucion', () => {
  let component: NuevaDevolucion;
  let fixture: ComponentFixture<NuevaDevolucion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevaDevolucion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevaDevolucion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
