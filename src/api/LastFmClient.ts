const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

export interface LastFmArtistInfo {
  name: string;
  bio: { summary: string; content: string };
  image: { url: string; size: string }[];
  similar: { name: string; image?: string }[];
  tags: string[];
  listeners?: string;
  playcount?: string;
}

export async function getLastFmArtistInfo(
  artistName: string,
  apiKey: string,
): Promise<LastFmArtistInfo | null> {
  if (!apiKey || !artistName) return null;

  const params = new URLSearchParams({
    method: 'artist.getinfo',
    artist: artistName,
    api_key: apiKey,
    format: 'json',
    autocorrect: '1',
  });

  const response = await fetch(`${BASE_URL}?${params}`);

  if (!response.ok) {
    if (response.status === 429) {
      // Rate limited — wait and retry once
      await new Promise((r) => setTimeout(r, 2000));
      const retry = await fetch(`${BASE_URL}?${params}`);
      if (!retry.ok) return null;
      return parseArtistResponse(await retry.json());
    }
    return null;
  }

  return parseArtistResponse(await response.json());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseArtistResponse(data: any): LastFmArtistInfo | null {
  const artist = data?.artist;
  if (!artist) return null;

  // Clean bio HTML — strip Last.fm links and tags
  const rawSummary = artist.bio?.summary ?? '';
  const rawContent = artist.bio?.content ?? '';
  const cleanHtml = (html: string) =>
    html
      .replace(/<a[^>]*>Read more on Last\.fm<\/a>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();

  // Parse images
  const images = (artist.image ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((img: any) => img['#text'])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((img: any) => ({ url: img['#text'], size: img.size }));

  // Parse similar artists
  const similar = (artist.similar?.artist ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => {
      const imgUrl = s.image?.find((i: { size: string }) => i.size === 'large')?.['#text']
        || s.image?.find((i: { size: string }) => i.size === 'medium')?.['#text']
        || '';
      return {
        name: s.name,
        // Last.fm returns empty strings or placeholder URLs — filter them out
        image: imgUrl && !imgUrl.includes('2a96cbd8b46e442fc41c2b86b821562f') ? imgUrl : undefined,
      };
    });

  // Parse tags
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tags = (artist.tags?.tag ?? []).map((t: any) => t.name as string);

  return {
    name: artist.name,
    bio: { summary: cleanHtml(rawSummary), content: cleanHtml(rawContent) },
    image: images,
    similar,
    tags,
    listeners: artist.stats?.listeners,
    playcount: artist.stats?.playcount,
  };
}
