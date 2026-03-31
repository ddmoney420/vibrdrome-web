export async function shareUrl(title: string, url?: string): Promise<void> {
  const shareData = {
    title,
    url: url ?? window.location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch {
      // User cancelled or share failed — fall back to clipboard
      await copyToClipboard(shareData.url);
    }
  } else {
    await copyToClipboard(shareData.url);
  }
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
