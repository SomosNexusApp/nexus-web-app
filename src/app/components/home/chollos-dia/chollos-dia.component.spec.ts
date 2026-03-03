import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChollosDiaComponent } from './chollos-dia.component';

describe('ChollosDiaComponent', () => {
  let component: ChollosDiaComponent;
  let fixture: ComponentFixture<ChollosDiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChollosDiaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChollosDiaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
