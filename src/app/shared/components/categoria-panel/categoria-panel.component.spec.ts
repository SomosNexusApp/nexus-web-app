import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriaPanelComponent } from './categoria-panel.component';

describe('CategoriaPanelComponent', () => {
  let component: CategoriaPanelComponent;
  let fixture: ComponentFixture<CategoriaPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriaPanelComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
