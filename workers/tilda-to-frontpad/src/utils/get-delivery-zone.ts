const TICKET_DELIVERY_LABEL = 'Доставка по абонементу';
const DELIVERY_LABEL = 'Доставка курьером';

export type Zone = {
  pickup?: boolean;
  sku?: string;
  /** Бесплатная доставка в сценарии идёт после компота. */
  kompotFirst?: boolean;
};

type GetDeliveryZoneType = {
  type: string;
  subtotal: number;
  deliveryAmount: number;
};

const DELIVERY_SKU_LIST: Record<number, number> = {
  1150: 1113,
  250: 1007,
  400: 1008,
  550: 1009,
  800: 1112
};

export function getDeliveryZone({
  type,
  subtotal,
  deliveryAmount
}: GetDeliveryZoneType): Zone | null {
  if (!type || subtotal === undefined || deliveryAmount === undefined) {
    return null;
  }

  if (normalize(type) === normalize(DELIVERY_LABEL)) {
    if (subtotal >= 6000) {
      return { sku: '1010', kompotFirst: true };
    }

    const sku = DELIVERY_SKU_LIST[deliveryAmount];
    if (sku) {
      return { sku: sku.toString() };
    }
  }

  if (normalize(type) === normalize(TICKET_DELIVERY_LABEL)) {
    return { sku: '1011' };
  }

  return { pickup: true };
}

function normalize(str: string) {
  return str.trim().toLowerCase();
}
