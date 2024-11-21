import { TestBed } from '@angular/core/testing';

import { ChatareaServiceService } from './chatarea-service.service';

describe('ChatareaServiceService', () => {
  let service: ChatareaServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatareaServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
