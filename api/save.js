// api/save.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { content, path, sha } = req.body;
  const token = process.env.GITHUB_TOKEN; // Тот самый токен из Vercel!

  const response = await fetch(`https://api.github.com/repos/KirillTY3/ARISHelper/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Автоматическое обновление через сайт',
      content: btoa(unescape(encodeURIComponent(content))), // Кодируем текст
      sha: sha
    })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}