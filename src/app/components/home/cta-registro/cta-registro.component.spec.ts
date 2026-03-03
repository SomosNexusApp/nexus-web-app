import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CtaRegistroComponent } from './cta-registro.component';

describe('CtaRegistroComponent', () => {
  let component: CtaRegistroComponent;
  let fixture: ComponentFixture<CtaRegistroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CtaRegistroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CtaRegistroComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
