// api/save.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const { content, path } = req.body;
  const token = process.env.GITHUB_TOKEN; // Тот самый токен из Vercel!

  if (!token) {
    console.error('GitHub token is missing in Vercel ENV');
    return res.status(500).json({ error: 'Server configuration error: GitHub token is missing.' });
  }

  // Добавлена проверка на наличие обязательных полей
  if (!content || !path) {
    return res.status(400).json({ error: '`content` and `path` are required.' });
  }

  try {
    let sha;
    // 1. Получаем текущий SHA файла, если он существует
    const getRes = await fetch(`https://api.github.com/repos/KirillTY3/ARISHelper/contents/${path}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json' // Рекомендуемый заголовок для GitHub API
      }
    });

    if (getRes.ok) {
      // Файл существует, получаем его SHA для обновления
      const fileData = await getRes.json();
      sha = fileData.sha;
    } else if (getRes.status !== 404) {
      // Если ошибка не "Not Found", значит что-то пошло не так (например, нет прав)
      const errorData = await getRes.json();
      console.error('GitHub API error on get file:', errorData);
      return res.status(getRes.status).json({ error: 'GitHub API error on get file', details: errorData.message });
    }
    // Если статус 404, sha останется undefined. Это нормально, GitHub создаст новый файл.

    // 2. Обновляем или создаем файл
    const response = await fetch(`https://api.github.com/repos/KirillTY3/ARISHelper/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: 'Автоматическое обновление базы из панели',
        content: Buffer.from(content, 'utf8').toString('base64'),
        sha: sha // sha будет undefined для новых файлов, что корректно
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    res.status(500).json({ error: 'An unexpected server error occurred', details: error.message });
  }
}