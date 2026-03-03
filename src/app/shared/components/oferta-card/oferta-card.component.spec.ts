import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfertaCardComponent } from './oferta-card.component';

describe('OfertaCardComponent', () => {
  let component: OfertaCardComponent;
  let fixture: ComponentFixture<OfertaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfertaCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfertaCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
