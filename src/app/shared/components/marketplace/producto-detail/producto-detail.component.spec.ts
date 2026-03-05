import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductoDetailComponent } from './producto-detail.component';

describe('ProductDetailComponent', () => {
  let component: ProductoDetailComponent;
  let fixture: ComponentFixture<ProductoDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductoDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
