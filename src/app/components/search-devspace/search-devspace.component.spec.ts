import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchDevspaceComponent } from './search-devspace.component';

describe('SearchDevspaceComponent', () => {
  let component: SearchDevspaceComponent;
  let fixture: ComponentFixture<SearchDevspaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchDevspaceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchDevspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
