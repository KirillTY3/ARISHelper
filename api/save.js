export default async function handler(req, res) {
    // 1. РАЗРЕШАЕМ CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Отвечаем на Preflight запрос (ПАРАМЕТРЫ / OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).json({ status: 'OK' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: `Метод ${req.method} не разрешен` });
    }

    try {
        console.log('[API] Получен POST запрос');

        // Защита: гарантируем, что body читается правильно
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { }
        }

        const { content, path, sha } = body || {};

        if (!content || !path || !sha) {
            console.error('[API] Ошибка: нет обязательных данных (content, path, sha)');
            return res.status(400).json({ message: 'Отсутствуют необходимые данные (content, path, sha)' });
        }

        // 2. ПОЛУЧАЕМ ТОКЕН ИЗ НАСТРОЕК VERCEL
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
        if (!GITHUB_TOKEN) {
            console.error('[API] ОШИБКА: GITHUB_TOKEN отсутствует в Vercel');
            return res.status(500).json({ message: 'GITHUB_TOKEN не найден! Убедитесь, что вы сделали НОВЫЙ ДЕПЛОЙ (Redeploy) в Vercel после добавления токена.' });
        }

        // 3. ОТПРАВЛЯЕМ КОД НА GITHUB
        console.log(`[API] Отправка файла ${path} на GitHub...`);
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
            console.error('[API] GitHub вернул ошибку:', data);
            return res.status(githubResponse.status).json({ message: `Ошибка GitHub: ${data.message}` });
        }

        console.log('[API] Успешно сохранено на GitHub!');
        return res.status(200).json({ success: true, message: 'Успешно сохранено' });

    } catch (error) {
        console.error('[API] КРИТИЧЕСКАЯ ОШИБКА:', error);
        // Выводим саму суть ошибки прямо на сайт
        return res.status(500).json({ message: `Системная ошибка: ${error.message}` });
    }
}
