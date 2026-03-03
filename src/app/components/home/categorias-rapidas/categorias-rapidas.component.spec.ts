import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriasRapidasComponent } from './categorias-rapidas.component';

describe('CategoriasRapidasComponent', () => {
  let component: CategoriasRapidasComponent;
  let fixture: ComponentFixture<CategoriasRapidasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriasRapidasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriasRapidasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
