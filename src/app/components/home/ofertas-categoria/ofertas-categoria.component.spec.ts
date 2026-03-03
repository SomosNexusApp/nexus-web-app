import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfertasCategoriaComponent } from './ofertas-categoria.component';

describe('OfertasCategoriaComponent', () => {
  let component: OfertasCategoriaComponent;
  let fixture: ComponentFixture<OfertasCategoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfertasCategoriaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfertasCategoriaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
