// Rate limiting no cliente
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxCalls: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxCalls) return false;

  entry.count++;
  return true;
}

// Sanitizar input antes de enviar para a IA
export function sanitizeForAI(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s\-.,;:!?()R$%×]/g, '')
    .slice(0, 2000)
    .trim();
}

// Mascarar token para exibição
export function maskToken(token: string): string {
  if (token.length < 12) return '****';
  return token.slice(0, 6) + '****' + token.slice(-4);
}

// Validar formato do ad account ID
export function validateAdAccountId(id: string): boolean {
  return /^act_\d{10,20}$/.test(id);
}

// Validar token Meta (formato básico)
export function validateMetaTokenFormat(token: string): boolean {
  return token.startsWith('EAA') && token.length > 50;
}
