import type { OrderWebhookPayload } from './types';
import { CustomError, getDeliveryZone, type Zone } from './utils';

export type CartLine = {
  sku: string;
  quantity: string;
};

export type FrontpadOrder = {
  secret: string;
  street: string;
  name: string;
  phone: string;
  descr: string;
  datetime: string;
  products: CartLine[];
};

const KOMPOT_SKU = '067';

/** 0 / 1 / 2 / 3 компота на <3 / 3–5 / 6–8 / 9+ позиций корзины. */
export function kompotQuantity(productCount: number) {
  if (productCount < 3) {
    return 0;
  }
  if (productCount < 6) {
    return 1;
  }
  if (productCount < 9) {
    return 2;
  }
  return 3;
}

export function buildOrder(
  body: OrderWebhookPayload,
  secretFromEnv?: string
): FrontpadOrder {
  if (!secretFromEnv) {
    throw new CustomError('Не задан secret Frontpad', 500);
  }

  const zone = getDeliveryZone({
    type: body['Способ_доставки'],
    amount: Number(body.payment.amount),
    deliveryAmount: body.payment.delivery_price
  });
  if (!zone) {
    throw new CustomError(
      `Неизвестный способ доставки: ${body['Способ_доставки'] || 'пусто'}`,
      400
    );
  }

  const cart = cartLines(body);
  const products = withExtras(cart, zone);
  if (products.length === 0) {
    throw new CustomError('В заказе нет товаров', 400);
  }

  const date = body.Date;
  const comment = body.comment;
  const descr = [zone.pickup ? 'Доставка - Самовывоз.' : '', comment]
    .filter(Boolean)
    .join('\n');

  return {
    secret: secretFromEnv,
    street: body['Адрес_доставки'],
    name: body['Имя'],
    phone: body['Телефон'],
    descr,
    datetime: date ? `${date} 13:00:00` : '',
    products
  };
}

export function encodeOrder(order: FrontpadOrder): URLSearchParams {
  const params = new URLSearchParams({
    secret: order.secret,
    street: order.street,
    name: order.name,
    phone: order.phone,
    descr: order.descr
  });

  if (order.datetime) {
    params.set('datetime', order.datetime);
  }

  order.products.forEach((line, index) => {
    params.set(`product[${index}]`, line.sku);
    params.set(`product_kol[${index}]`, line.quantity);
  });

  return params;
}

function withExtras(cart: CartLine[], zone: Zone): CartLine[] {
  const delivery: CartLine[] = zone.sku
    ? [{ sku: zone.sku, quantity: '1' }]
    : [];
  const qty = kompotQuantity(cart.length);
  const gift: CartLine[] = qty
    ? [{ sku: KOMPOT_SKU, quantity: String(qty) }]
    : [];
  const head = zone.kompotFirst
    ? [...gift, ...delivery]
    : [...delivery, ...gift];

  return [...head, ...cart];
}

function parsePayment(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new CustomError('payment не JSON', 400);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toCartLine(item: unknown): CartLine | null {
  if (!isRecord(item)) {
    return null;
  }

  const sku = String(item.sku ?? '').trim();
  if (!sku) {
    return null;
  }

  const { quantity } = item;
  const isEmptyQuantity = quantity == null || quantity === '';

  return {
    sku,
    quantity: isEmptyQuantity ? '1' : String(quantity)
  };
}

function cartLines(body: Record<string, unknown>): CartLine[] {
  const payment = parsePayment(body.payment);

  if (!isRecord(payment) || !Array.isArray(payment.products)) {
    return [];
  }

  return payment.products
    .map(toCartLine)
    .filter((line): line is CartLine => line !== null);
}
