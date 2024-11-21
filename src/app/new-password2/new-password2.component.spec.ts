import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPassword2Component } from './new-password2.component';

describe('NewPassword2Component', () => {
  let component: NewPassword2Component;
  let fixture: ComponentFixture<NewPassword2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPassword2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewPassword2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
