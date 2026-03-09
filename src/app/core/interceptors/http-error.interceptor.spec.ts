import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { httpErrorInterceptor } from './http-error.interceptor';
import { MessageService } from 'primeng/api';

describe('httpErrorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let messageService: MessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        MessageService
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    messageService = TestBed.inject(MessageService);
    spyOn(messageService, 'add');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should not show error on successful request', () => {
    httpClient.get('/test').subscribe();
    httpMock.expectOne('/test').flush({ data: 'ok' });
    expect(messageService.add).not.toHaveBeenCalled();
  });

  it('should show connection error for status 0', () => {
    httpClient.get('/test').subscribe({ error: () => {} });
    httpMock.expectOne('/test').error(new ProgressEvent('error'), { status: 0 });

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'error',
      detail: jasmine.stringContaining('Cannot connect to the server')
    }));
  });

  it('should show not found error for status 404', () => {
    httpClient.get('/test').subscribe({ error: () => {} });
    httpMock.expectOne('/test').flush(
      { message: 'Resource not found' },
      { status: 404, statusText: 'Not Found' }
    );

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'error',
      detail: 'Resource not found'
    }));
  });

  it('should show default 404 message when no message in body', () => {
    httpClient.get('/test').subscribe({ error: () => {} });
    httpMock.expectOne('/test').flush(null, { status: 404, statusText: 'Not Found' });

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      detail: 'The requested resource was not found.'
    }));
  });

  it('should show bad request error for status 400', () => {
    httpClient.get('/test').subscribe({ error: () => {} });
    httpMock.expectOne('/test').flush(
      { message: 'Invalid data' },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      detail: 'Invalid data'
    }));
  });

  it('should show server error for status 500', () => {
    httpClient.get('/test').subscribe({ error: () => {} });
    httpMock.expectOne('/test').flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      detail: 'A server error occurred. Please try again later.'
    }));
  });

  it('should use custom message from error body for other statuses', () => {
    httpClient.get('/test').subscribe({ error: () => {} });
    httpMock.expectOne('/test').flush(
      { message: 'Custom error' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      detail: 'Custom error'
    }));
  });

  it('should re-throw the error with userMessage', () => {
    let caughtError: any;
    httpClient.get('/test').subscribe({
      error: (err) => { caughtError = err; }
    });
    httpMock.expectOne('/test').flush(null, { status: 500, statusText: 'Server Error' });

    expect(caughtError.userMessage).toBe('A server error occurred. Please try again later.');
  });
});
