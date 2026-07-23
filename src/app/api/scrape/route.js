import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch the URL' }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let rawTitle = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const image_url = $('meta[property="og:image"]').attr('content') || '';
    let priceString = $('meta[property="product:price:amount"]').attr('content') || $('meta[name="price"]').attr('content') || '';
    let vendor = $('meta[property="og:site_name"]').attr('content') || '';

    // Advanced search for JSON-LD (Standard for E-commerce)
    if (!priceString) {
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
      if (!priceString) priceString = $('.pip-temp-price__integer').first().text();
    } else if (url.includes('poltronesofa.com')) {
      vendor = 'Poltronesofà';
      if (!priceString) priceString = $('.price').first().text();
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
    } else {
      // Also check description for dimensions
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
    if (lowerTitle.includes('divano')) category = 'Divano';
    else if (lowerTitle.includes('letto')) category = 'Letto';
    else if (lowerTitle.includes('tavolo')) category = 'Tavolo';
    else if (lowerTitle.includes('sedia')) category = 'Sedia';
    else if (lowerTitle.includes('armadio')) category = 'Armadio';
    else if (lowerTitle.includes('comodino')) category = 'Comodino';
    else if (lowerTitle.includes('lampada')) category = 'Lampada';
    else if (lowerTitle.includes('tappeto')) category = 'Tappeto';

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
