// Vercel Serverless Function - /api/strava
// Fetches BJJ/MMA activities from Strava and returns them as JSON.
// Credentials are stored as Vercel environment variables (never in code).

export default async function handler(req, res) {
  // Allow the dashboard to call this from any origin (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Cache for 1 hour so Strava rate limits are not hit on every page load
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');

  try {
    // ---- Step 1: Exchange refresh token for a fresh access token ----
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: process.env.STRAVA_REFRESH_TOKEN,
        grant_type:    'refresh_token',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return res.status(502).json({ error: 'Token exchange failed', detail: err });
    }

    const { access_token } = await tokenRes.json();

    // ---- Step 2: Fetch all activities (paginated) ----
    const allActivities = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const actRes = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      if (!actRes.ok) break;
      const batch = await actRes.json();
      if (!batch.length) break;

      allActivities.push(...batch);
      if (batch.length < perPage) break;
      page++;
    }

    // ---- Step 3: Filter to BJJ/MMA only ----
    const BJJ_KEYWORDS = ['jiu', 'bjj', 'martial art', 'mma', 'grappling'];

    const sessions = allActivities
      .filter(a => {
        const name = (a.name || '').toLowerCase();
        const type = (a.type || '').toLowerCase();
        return BJJ_KEYWORDS.some(k => name.includes(k) || type.includes(k));
      })
      .map(a => {
        const dateStr = a.start_date_local.substring(0, 10);
        const totalMin = Math.round(a.moving_time / 60 * 100) / 100;
        const h = Math.floor(totalMin / 60);
        const m = Math.floor(totalMin % 60);
        const s = Math.round((totalMin * 60) % 60);
        const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        const dt = new Date(dateStr);

        return {
          dateStr,
          year:     dt.getFullYear(),
          month:    dateStr.substring(0, 7),
          totalMin,
          timeStr,
          avgHR:    a.average_heartrate ? Math.round(a.average_heartrate) : null,
          maxHR:    a.max_heartrate     ? Math.round(a.max_heartrate)     : null,
          calories: a.calories          ? Math.round(a.calories)          : 0,
          name:     a.name,
        };
      })
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    return res.status(200).json({ sessions, fetchedAt: new Date().toISOString() });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
