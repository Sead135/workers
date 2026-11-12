export type OrderProduct = {
  name: string;
  quantity: number;
  amount: number;
  externalid: string;
  price: string;
  sku: string;
};

export type OrderPayment = {
  sys: string;
  systranid: string;
  orderid: string;
  products: OrderProduct[];
  amount: string;
  subtotal: string;
  delivery: string;
  delivery_price: number;
  delivery_fio: string;
  delivery_address: string;
  delivery_comment: string;
};

export type TestWebhookPayload = {
  test: 'test';
};

export type OrderWebhookPayload = {
  Имя: string;
  Телефон: string;
  Способ_доставки: string;
  Адрес_доставки?: string;
  Адрес_доставки_абонемент?: string;
  Этаж?: string;
  Этаж_абонемент?: string;
  Подъезд?: string;
  Подъезд_абонемент?: string;
  Номер_квартиры?: string;
  Номер_квартиры_абонемент?: string;
  'food-container': string;
  Date: string;
  interval: string;
  comment: string;
  Checkbox: string;
  payment: OrderPayment;
  formid: string;
  formname: string;
  test?: never;
};

export type WebhookPayload = OrderWebhookPayload | TestWebhookPayload;

export const WEBHOOK_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  UNKNOWN: 'unknown'
} as const;

export type WebhookStatus =
  (typeof WEBHOOK_STATUS)[keyof typeof WEBHOOK_STATUS];
