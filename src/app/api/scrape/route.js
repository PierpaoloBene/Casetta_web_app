import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

// Detect if a URL belongs to Amazon
function isAmazonUrl(url) {
  return /amazon\.(it|com|co\.uk|de|fr|es)/.test(url);
}

// Extract the ASIN from an Amazon product URL
function extractAsin(url) {
  const match = url.match(/\/(?:dp|gp\/product|d)\/([A-Z0-9]{10})/);
  return match ? match[1] : null;
}

// Fetch via Microlink (headless browser, bypasses bot-detection)
async function fetchViaMicrolink(url) {
  const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=false&meta=true`;
  const res = await fetch(microlinkUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 'success') return null;
  return data.data; // { title, description, image: { url }, publisher, ... }
}

// Amazon-specific scraper: direct fetch first, Microlink fallback
async function scrapeAmazon(url) {
  let rawTitle = '';
  let image_url = '';
  let priceString = '';
  const vendor = 'Amazon';

  // --- Attempt 1: direct fetch with Amazon-friendly headers ---
  let html = null;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    // Amazon returns 200 even for bot-block pages, so we check the body
    if (response.ok) {
      const text = await response.text();
      // If Amazon served a CAPTCHA / bot-detection page, html will contain "robot check"
      if (!text.toLowerCase().includes('robot check') && !text.toLowerCase().includes('captcha')) {
        html = text;
      }
    }
  } catch (_) {
    html = null;
  }

  if (html) {
    const $ = cheerio.load(html);

    // Title: Amazon uses #productTitle, og:title is often truncated
    rawTitle =
      $('#productTitle').text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      '';

    // Main product image: Amazon uses #landingImage or og:image
    image_url =
      $('#landingImage').attr('src') ||
      $('#imgBlkFront').attr('src') ||
      $('meta[property="og:image"]').attr('content') ||
      '';

    // Price: Amazon uses several selectors depending on product type
    priceString =
      $('.a-price .a-offscreen').first().text() ||
      $('#priceblock_ourprice').text() ||
      $('#priceblock_dealprice').text() ||
      $('[data-asin-price]').attr('data-asin-price') ||
      $('meta[property="product:price:amount"]').attr('content') ||
      '';

    // JSON-LD fallback for price
    if (!priceString) {
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const data = JSON.parse($(el).html());
          const searchData = Array.isArray(data) ? data : [data];
          for (const item of searchData) {
            if (item['@type'] === 'Product' && item.offers) {
              priceString = (item.offers.price || item.offers[0]?.price || '').toString();
              if (priceString) return false;
            }
          }
        } catch (_) {}
      });
    }
  }

  // --- Attempt 2: Microlink fallback (if direct fetch failed or is incomplete) ---
  if (!rawTitle || !image_url) {
    try {
      const mlData = await fetchViaMicrolink(url);
      if (mlData) {
        if (!rawTitle && mlData.title) rawTitle = mlData.title;
        if (!image_url && mlData.image?.url) image_url = mlData.image.url;
      }
    } catch (_) {}
  }

  // Clean up Amazon title noise (e.g. " : Amazon.it: ..." or "Acquista ...")
  if (rawTitle.includes(': Amazon')) rawTitle = rawTitle.split(': Amazon')[0].trim();
  if (rawTitle.includes('| Amazon')) rawTitle = rawTitle.split('| Amazon')[0].trim();

  return { rawTitle, image_url, priceString, vendor };
}

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let rawTitle = '';
    let image_url = '';
    let priceString = '';
    let vendor = '';
    let html = null;

    // ── Amazon special handler ──────────────────────────────────────────
    if (isAmazonUrl(url)) {
      const amazonResult = await scrapeAmazon(url);
      rawTitle = amazonResult.rawTitle;
      image_url = amazonResult.image_url;
      priceString = amazonResult.priceString;
      vendor = amazonResult.vendor;
    } else {
      // --- Generic: Attempt 1: direct fetch + cheerio ---
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
          },
        });
        if (response.ok) {
          html = await response.text();
        }
      } catch (_) {
        html = null;
      }

      if (html) {
        const $ = cheerio.load(html);
        rawTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
        image_url = $('meta[property="og:image"]').attr('content') || '';
        priceString = $('meta[property="product:price:amount"]').attr('content') || $('meta[name="price"]').attr('content') || '';
        vendor = $('meta[property="og:site_name"]').attr('content') || '';
      }

      // --- Generic: Attempt 2: Microlink fallback ---
      if (!html || !image_url) {
        try {
          const mlData = await fetchViaMicrolink(url);
          if (mlData) {
            if (!rawTitle && mlData.title) rawTitle = mlData.title;
            if (!image_url && mlData.image?.url) image_url = mlData.image.url;
            if (!vendor && mlData.publisher) vendor = mlData.publisher;
          }
        } catch (_) {}
      }
    }

    // If still no data at all, return an error
    if (!rawTitle && !image_url) {
      return NextResponse.json({ error: 'Failed to fetch the URL' }, { status: 422 });
    }

    let $ = html ? cheerio.load(html) : null;

    // Advanced search for JSON-LD (Standard for E-commerce) — generic only
    if (!priceString && $ && !isAmazonUrl(url)) {
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const data = JSON.parse($(el).html());
          const searchData = Array.isArray(data) ? data : [data];
          for (const item of searchData) {
            if (item['@type'] === 'Product' && item.offers) {
              if (item.offers.price) {
                priceString = item.offers.price.toString();
              } else if (Array.isArray(item.offers) && item.offers[0]?.price) {
                priceString = item.offers[0].price.toString();
              }
              if (priceString) return false;
            }
          }
        } catch (e) {}
      });
    }

    if (url.includes('ikea.com')) {
      vendor = 'IKEA';
      if (!priceString && $) priceString = $('.pip-temp-price__integer').first().text();
    } else if (url.includes('poltronesofa.com')) {
      vendor = 'Poltronesofà';
      if (!priceString && $) priceString = $('.price').first().text();
    }

    let price = null;
    if (priceString) {
      const numericString = priceString.replace(/[^0-9.,]/g, '').replace(',', '.');
      const parsedPrice = parseFloat(numericString);
      if (!isNaN(parsedPrice)) {
        price = parsedPrice;
      }
    }

    // Try to extract dimensions (e.g., 160x235)
    let dimensions = '';
    const dimMatch = rawTitle.match(/(\d+)\s*[xX]\s*(\d+)/);
    if (dimMatch) {
      dimensions = `${dimMatch[1]}x${dimMatch[2]}`;
    } else if ($) {
      const desc = $('meta[property="og:description"]').attr('content') || '';
      const descMatch = desc.match(/(\d+)\s*[xX]\s*(\d+)/);
      if (descMatch) {
        dimensions = `${descMatch[1]}x${descMatch[2]}`;
      }
    }

    // Parse the title intelligently
    let title = rawTitle;
    if (title.includes('- IKEA')) {
      title = title.split('- IKEA')[0].trim();
    }
    // Take the first part before a comma to get the core name
    if (title.includes(',')) {
      title = title.split(',')[0].trim();
    }

    const lowerTitle = title.toLowerCase();
    let category = '';
    if (lowerTitle.includes('divano') || lowerTitle.includes('sofa') || lowerTitle.includes('sofà')) category = 'Divano';
    else if (lowerTitle.includes('letto') || lowerTitle.includes('bed')) category = 'Letto';
    else if (lowerTitle.includes('tavolo') || lowerTitle.includes('table')) category = 'Tavolo';
    else if (lowerTitle.includes('sedia') || lowerTitle.includes('chair')) category = 'Sedia';
    else if (lowerTitle.includes('armadio') || lowerTitle.includes('wardrobe')) category = 'Armadio';
    else if (lowerTitle.includes('comodino') || lowerTitle.includes('nightstand')) category = 'Comodino';
    else if (lowerTitle.includes('lampada') || lowerTitle.includes('lamp')) category = 'Lampada';
    else if (lowerTitle.includes('tappeto') || lowerTitle.includes('rug')) category = 'Tappeto';

    let room = '';
    if (category === 'Divano' || category === 'Tappeto') room = 'Soggiorno';
    else if (category === 'Letto' || category === 'Comodino' || category === 'Armadio') room = 'Camera da letto';

    return NextResponse.json({
      title: title.trim() || rawTitle,
      image_url: image_url.trim(),
      price,
      vendor: vendor.trim(),
      category,
      room,
      dimensions
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: 'Failed to scrape the URL' }, { status: 500 });
  }
}
