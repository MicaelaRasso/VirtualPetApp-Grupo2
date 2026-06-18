export type OrderStatus =
  | 'IN_PREPARATION'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'NOT_DELIVERED'
  | 'CANCELLED';

export interface ShippingAddress {
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  [key: string]: any;
}

export interface OrderItem {
  productNameSnapshot: string;
  quantity: number;
  price?: string;
  [key: string]: any;
}

export interface Shipment {
  id: string;
  riderId: string | null;
  riderName: string | null;
  takenAt: string | null;
  status: string;
  trackingNumber: string;
  methodName: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  customerName: string;
  shippingAddress: ShippingAddress;
  deliveryAttempts: number;
  total: string;
  items: OrderItem[];
  shipment?: Shipment;
}

export interface OrdersPage {
  data: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
