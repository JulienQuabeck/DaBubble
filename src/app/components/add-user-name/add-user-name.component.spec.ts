import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserNameComponent } from './add-user-name.component';

describe('AddUserNameComponent', () => {
  let component: AddUserNameComponent;
  let fixture: ComponentFixture<AddUserNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUserNameComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddUserNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
