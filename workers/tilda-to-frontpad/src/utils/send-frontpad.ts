const FRONTPAD_NEW_ORDER = 'https://app.frontpad.ru/api/index.php?new_order';

type SendFrontpadResult = {
  success: boolean;
  text: string;
};

export async function sendFrontpad(
  params: URLSearchParams
): Promise<SendFrontpadResult> {
  const response = await fetch(FRONTPAD_NEW_ORDER, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params
  });

  const text = await response.text();

  const success =
    response.ok && !/result=error|"result"\s*:\s*"error"/.test(text);

  return { success, text };
}
