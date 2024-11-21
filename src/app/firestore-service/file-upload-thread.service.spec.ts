import { TestBed } from '@angular/core/testing';

import { FileUploadThreadService } from './file-upload-thread.service';

describe('FileUploadThreadService', () => {
  let service: FileUploadThreadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileUploadThreadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
