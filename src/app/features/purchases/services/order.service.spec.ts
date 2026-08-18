import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { Order } from '../../../shared/models';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should convert camelCase order data into snake_case payload for the backend', () => {
    const order: Order = {
      id: 'o-1',
      customerName: 'John Doe',
      customerPhone: '9876543210',
      date: '2026-08-18',
      lines: [
        {
          productId: 'p-1',
          name: 'Pipe',
          hsnCode: '3917',
          quantity: 2,
          unitPrice: 5000,
          discount: 0,
          totalPrice: 10000,
        },
      ],
      grandTotal: 10000,
      subtotal: 10000,
      overallDiscount: 0,
      paymentStatus: 'paid',
      payments: [{ mode: 'cash', amount: 10000 }],
      createdAt: '2026-08-18T00:00:00.000Z',
    };

    service.placeOrder(order).subscribe();

    const req = httpMock.expectOne((request) => request.url.includes('/orders'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(jasmine.objectContaining({
      customer_name: 'John Doe',
      customer_phone: '9876543210',
      grand_total: 10000,
      payment_status: 'paid',
      lines: [jasmine.objectContaining({
        product_id: 'p-1',
        hsn_code: '3917',
        unit_price: 5000,
        total_price: 10000,
      })],
    }));

    req.flush({
      ...order,
      customer_name: 'John Doe',
      customer_phone: '9876543210',
      grand_total: 10000,
      payment_status: 'paid',
      lines: [{
        ...order.lines[0],
        product_id: 'p-1',
        hsn_code: '3917',
        unit_price: 5000,
        total_price: 10000,
      }],
      payments: [{ mode: 'cash', amount: 10000 }],
    });
  });
});
