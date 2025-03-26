// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({ name: 'Cymasphere API', status: 'online', timestamp: new Date().toISOString() });
} 