import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch URL: ${response.status}` }), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await response.text();

    // --- Parse meta tags with regex (no DOM parser in Deno edge) ---
    const getMetaContent = (property: string): string => {
      const ogMatch = html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i")) ||
                      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"));
      if (ogMatch) return ogMatch[1];
      const nameMatch = html.match(new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i")) ||
                        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"));
      return nameMatch ? nameMatch[1] : "";
    };

    let rawTitle = getMetaContent("og:title");
    if (!rawTitle) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      rawTitle = titleMatch ? titleMatch[1] : "";
    }

    let image_url = getMetaContent("og:image");
    let priceString = getMetaContent("product:price:amount") || getMetaContent("price");
    let vendor = getMetaContent("og:site_name");

    // Try JSON-LD for price
    if (!priceString) {
      const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const m of ldMatches) {
        try {
          const parsed = JSON.parse(m[1]);
          const items = Array.isArray(parsed) ? parsed : [parsed];
          for (const item of items) {
            if (item["@type"] === "Product" && item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
              priceString = offers[0]?.price?.toString() || "";
              if (!image_url && item.image) image_url = Array.isArray(item.image) ? item.image[0] : item.image;
              if (!rawTitle && item.name) rawTitle = item.name;
              if (priceString) break;
            }
          }
        } catch (_) { /* skip */ }
        if (priceString) break;
      }
    }

    // Vendor overrides
    if (url.includes("ikea.com")) vendor = "IKEA";
    else if (url.includes("poltronesofa.com")) vendor = "Poltronesofà";
    else if (url.includes("maisons-du-monde")) vendor = "Maisons du Monde";
    else if (url.includes("westelm")) vendor = "West Elm";
    else if (url.includes("zara.com")) vendor = "Zara Home";

    // Parse price
    let price: number | null = null;
    if (priceString) {
      const numericString = priceString.replace(/[^0-9.,]/g, "").replace(",", ".");
      const parsedPrice = parseFloat(numericString);
      if (!isNaN(parsedPrice)) price = parsedPrice;
    }

    // Clean up title
    let title = rawTitle;
    if (title.includes("- IKEA")) title = title.split("- IKEA")[0].trim();
    if (title.includes(" | ")) title = title.split(" | ")[0].trim();
    if (title.includes(" - ")) title = title.split(" - ")[0].trim();
    if (title.includes(",")) title = title.split(",")[0].trim();

    // Dimensions from title or description
    let dimensions = "";
    const desc = getMetaContent("og:description");
    const dimMatch = (title + " " + desc).match(/(\d+)\s*[xX×]\s*(\d+)/);
    if (dimMatch) dimensions = `${dimMatch[1]}x${dimMatch[2]}`;

    // Category detection
    const lowerTitle = title.toLowerCase();
    let category = "";
    if (lowerTitle.includes("divano")) category = "Divano";
    else if (lowerTitle.includes("letto")) category = "Letto";
    else if (lowerTitle.includes("tavolo") || lowerTitle.includes("table")) category = "Tavolo";
    else if (lowerTitle.includes("sedia") || lowerTitle.includes("chair")) category = "Sedia";
    else if (lowerTitle.includes("armadio") || lowerTitle.includes("wardrobe")) category = "Armadio";
    else if (lowerTitle.includes("comodino")) category = "Comodino";
    else if (lowerTitle.includes("lampada") || lowerTitle.includes("lamp")) category = "Lampada";
    else if (lowerTitle.includes("tappeto") || lowerTitle.includes("rug")) category = "Tappeto";
    else if (lowerTitle.includes("libreria")) category = "Libreria";
    else if (lowerTitle.includes("specchio")) category = "Specchio";

    let room = "";
    if (category === "Divano" || category === "Tappeto" || category === "Libreria") room = "Soggiorno";
    else if (category === "Letto" || category === "Comodino" || category === "Armadio") room = "Camera da letto";
    else if (category === "Lampada") room = "";

    return new Response(JSON.stringify({
      title: (title || rawTitle).trim(),
      image_url: image_url.trim(),
      price,
      vendor: vendor.trim(),
      category,
      room,
      dimensions,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
