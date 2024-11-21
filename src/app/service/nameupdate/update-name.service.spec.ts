import { TestBed } from '@angular/core/testing';

import { UpdateNameService } from './update-name.service';

describe('UpdateNameService', () => {
  let service: UpdateNameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpdateNameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
