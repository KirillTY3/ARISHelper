export default async function handler(req, res) {
    // 1. РАЗРЕШАЕМ CORS (Чтобы браузер не выдавал ошибку "Failed to fetch")
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Обработка "Preflight" запроса браузера
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Разрешен только POST запрос' });
    }

    try {
        const { content, path, sha } = req.body;

        if (!content || !path || !sha) {
            return res.status(400).json({ message: 'Отсутствуют необходимые данные (content, path, sha)' });
        }

        // 2. ПОЛУЧАЕМ ТОКЕН ИЗ НАСТРОЕК VERCEL
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
        if (!GITHUB_TOKEN) {
            return res.status(500).json({ message: 'Ошибка сервера: GITHUB_TOKEN не настроен в Vercel' });
        }

        // 3. ОТПРАВЛЯЕМ КОД НА GITHUB
        // Переводим текст в Base64 (требование GitHub)
        const contentEncoded = Buffer.from(content, 'utf8').toString('base64');

        const githubResponse = await fetch(`https://api.github.com/repos/KirillTY3/ARISHelper/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: 'Обновление базы данных через Admin Panel',
                content: contentEncoded,
                sha: sha
            })
        });

        const data = await githubResponse.json();

        if (!githubResponse.ok) {
            return res.status(githubResponse.status).json({ message: data.message || 'Ошибка GitHub API' });
        }

        return res.status(200).json({ success: true, message: 'Успешно сохранено' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
}