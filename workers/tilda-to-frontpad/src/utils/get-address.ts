import type { OrderWebhookPayload } from '../types';

export type Address = {
  street: string;
  pod?: string;
  et?: string;
  apart?: string;
};

export function getAddress(body: OrderWebhookPayload): Address {
  const isTicket = !!body['Адрес_доставки_абонемент'];

  if (isTicket) {
    return {
      street: body['Адрес_доставки_абонемент'] ?? '',
      pod: body['Подъезд_абонемент'],
      et: body['Этаж_абонемент'],
      apart: body['Номер_квартиры_абонемент']
    };
  }

  return {
    street: body['Адрес_доставки'] ?? '',
    pod: body['Подъезд'],
    et: body['Этаж'],
    apart: body['Номер_квартиры']
  };
}
