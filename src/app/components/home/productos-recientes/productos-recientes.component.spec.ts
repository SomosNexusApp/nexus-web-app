import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosRecientesComponent } from './productos-recientes.component';

describe('ProductosRecientesComponent', () => {
  let component: ProductosRecientesComponent;
  let fixture: ComponentFixture<ProductosRecientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosRecientesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosRecientesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
