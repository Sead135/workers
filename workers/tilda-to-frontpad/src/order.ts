import { CustomError } from './utils';

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

type Zone = {
	pickup?: boolean;
	sku?: string;
	/** Бесплатная доставка в сценарии идёт после компота. */
	kompotFirst?: boolean;
};

const ZONES: Record<string, Zone> = {
	'Самовывоз (Стасова 169/1)': { pickup: true },
	'Платная доставка в радиусе 2 км (250 ₽) = 250': { sku: '1007' },
	'Платная доставка в радиусе 8 км (400 ₽) = 400': { sku: '1009' },
	'Платная доставка в радиусе 12 км (500 ₽) = 500': { sku: '1008' },
	'Доставка в радиусе дальше 12 км - по тарифу Яндекс такси': { sku: '088' },
	'Бесплатная доставка при заказе от 5 тыс. руб. в радиусе 8 км от Стасова 169/1':
		{ sku: '1010', kompotFirst: true },
	'Абонемент на месяц - 25 000 руб.': { sku: '1011' }
};

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
	body: Record<string, unknown>,
	secretFromEnv?: string
): FrontpadOrder {
	const secret = secretFromEnv || field(body, 'secret');
	if (!secret) {
		throw new CustomError('Не задан secret Frontpad', 500);
	}

	const zoneName = field(body, 'rajon_2');
	const zone = ZONES[zoneName];
	if (!zone) {
		throw new CustomError(`Неизвестный rajon_2: ${zoneName || 'пусто'}`, 400);
	}

	const cart = cartLines(body);
	const products = withExtras(cart, zone);
	if (products.length === 0) {
		throw new CustomError('В заказе нет товаров', 400);
	}

	const date = field(body, 'Date', 'date');
	const comment = field(body, 'comment');
	const rajon = field(body, 'rajon');
	const descr = [
		`Тара - ${rajon}.`,
		zone.pickup ? 'Доставка - Самовывоз.' : '',
		comment
	]
		.filter(Boolean)
		.join('\n');

	return {
		secret,
		street: field(body, 'street'),
		name: field(body, 'Name', 'name'),
		phone: field(body, 'Phone', 'phone'),
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

function field(body: Record<string, unknown>, ...keys: string[]) {
	for (const key of keys) {
		const value = body[key];
		if (typeof value === 'string') {
			return value.trim();
		}
		if (typeof value === 'number') {
			return String(value);
		}
	}
	return '';
}
