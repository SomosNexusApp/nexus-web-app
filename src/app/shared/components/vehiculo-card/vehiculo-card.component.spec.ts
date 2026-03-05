import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehiculoCardComponent } from './vehiculo-card.component';

describe('VehiculoCardComponent', () => {
  let component: VehiculoCardComponent;
  let fixture: ComponentFixture<VehiculoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehiculoCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehiculoCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
