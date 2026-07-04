export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
}

const rateStore = new Map();
export function rateLimiter(limit = 100, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress;
    const now = Date.now();
    let record = rateStore.get(ip);
    
    if (!record) {
      record = { count: 1, resetAt: now + windowMs };
      rateStore.set(ip, record);
    } else {
      if (now > record.resetAt) {
        record.count = 1;
        record.resetAt = now + windowMs;
      } else {
        record.count++;
      }
    }
    
    if (record.count > limit) {
      return res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
    next();
  };
}
