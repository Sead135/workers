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
  Адрес_доставки: string;
  Этаж: string;
  Подъезд: string;
  Номер_квартиры: string;
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
