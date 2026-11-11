export type Zone = {
  pickup?: boolean;
  sku?: string;
  /** Бесплатная доставка в сценарии идёт после компота. */
  kompotFirst?: boolean;
};

type GetDeliveryZoneType = {
  type: string;
  amount: number;
  deliveryAmount: number;
};

const DELIVERY_SKU_LIST: Record<number, number> = {
  1150: 1113,
  250: 1007,
  400: 1008,
  550: 1009,
  800: 1112,
  0: 1011
};

export function getDeliveryZone({
  type,
  amount,
  deliveryAmount
}: GetDeliveryZoneType): Zone | null {
  if (!type || amount === undefined || deliveryAmount === undefined) {
    return null;
  }

  if (normalize(type) === normalize('Доставка курьером')) {
    if (amount >= 6000) {
      return { sku: '1010', kompotFirst: true };
    }

    const sku = DELIVERY_SKU_LIST[deliveryAmount];
    if (sku) {
      return { sku: sku.toString() };
    }
  }

  return { pickup: true };
}

function normalize(str: string) {
  return str.trim().toLowerCase();
}
