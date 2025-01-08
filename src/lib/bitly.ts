export async function shortenUrl(longUrl: string): Promise<string> {
  const response = await fetch(`${import.meta.env.VITE_BITLY_API}/shorten`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ longUrl }),
  });

  const data = await response.json();
  if (response.ok) {
    return data;
  } else {
    throw new Error(data.message || 'Gagal membuat URL pendek');
  }
}

export async function deleteUrl(id: string): Promise<boolean> {
  const response = await fetch(`${import.meta.env.VITE_BITLY_API}/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  if (response.ok) {
    return true;
  } else {
    const data = await response.json();
    throw new Error(data.message || 'Gagal menghapus URL pendek');
  }
}