import { TestBed } from '@angular/core/testing';

import { OpenviduService } from './openvidu.service';

describe('OpenviduService', () => {
  let service: OpenviduService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenviduService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
