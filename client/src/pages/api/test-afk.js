export default async function handler(req, res) {
  console.log('📥 Test AFK received:', {
    method: req.method,
    body: req.body,
    headers: req.headers
  });

  res.status(200).json({ 
    received: true, 
    body: req.body,
    message: 'Test endpoint working' 
  });
}