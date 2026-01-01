import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, location, minPrice, maxPrice } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Starting ultra-precise model identification...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em moda e identificação de roupas. Analise a imagem com MÁXIMA PRECISÃO.

RETORNE APENAS JSON válido sem markdown:
{
  "garmentCategory": "CATEGORIA PRINCIPAL (suéter/tricô/malha, camisa/blusa, camiseta, polo, jaqueta, blazer, vestido, calça, shorts, saia)",
  "type": "DESCRIÇÃO ULTRA ESPECÍFICA (ex: suéter de tricô gola V, polo de malha piquet, camiseta básica gola redonda)",
  "material": "MATERIAL EXATO (tricô/malha/knit, algodão, poliéster, linho, jeans, couro, seda, lã)",
  "texture": "TEXTURA (tricotado/knit, liso/smooth, canelado/ribbed, waffle, piquet)",
  "color": "cor EXATA (bege areia, bege creme, azul marinho, verde musgo)",
  "style": "casual/formal/esportivo/streetwear/elegante",
  "brand": "MARCA se visível ou null",
  "modelName": "MODELO ESPECÍFICO se identificável ou null",
  "pattern": "liso/listrado/estampado/xadrez/floral",
  "fit": "regular/slim/oversized/relaxed",
  "neckline": "gola V/gola redonda/gola polo/gola alta/careca",
  "sleeves": "manga curta/manga longa/sem manga",
  "gender": "masculino/feminino/unissex",
  "keyFeatures": ["lista", "de", "características", "distintivas"],
  "searchQuery": "[categoria] [material/textura] [cor] [gênero] comprar"
}

CRÍTICO: 
- Diferencie CLARAMENTE entre: tricô/malha/knit vs camiseta de algodão vs polo piquet
- Uma peça de MALHA/TRICÔ NÃO é uma camiseta comum
- Identifique a TEXTURA do tecido (tricotado vs liso)`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Identifique esta roupa com MÁXIMA precisão, especialmente o tipo de tecido e categoria:" },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI Analysis:", analysisText);

    let clothingInfo;
    try {
      const cleanJson = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      clothingInfo = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      clothingInfo = {
        garmentCategory: "roupa",
        type: "roupa",
        color: "variada",
        style: "casual",
        brand: null,
        modelName: null,
        material: null,
        texture: null,
        pattern: "liso",
        searchQuery: "roupa moda"
      };
    }

    let exactProducts: any[] = [];
    let similarProducts: any[] = [];
    
    if (SERPAPI_KEY) {
      console.log("Searching with ultra-precise filters...");
      
      const hasBrand = clothingInfo.brand && clothingInfo.brand !== "null" && clothingInfo.brand !== null;
      const hasModel = clothingInfo.modelName && clothingInfo.modelName !== "null" && clothingInfo.modelName !== null;
      const category = (clothingInfo.garmentCategory || "").toLowerCase();
      const material = (clothingInfo.material || "").toLowerCase();
      const texture = (clothingInfo.texture || "").toLowerCase();
      const color = (clothingInfo.color || "").toLowerCase();
      
      // Detect if this is a knit/malha item
      const isKnitItem = material.includes("tricô") || material.includes("malha") || material.includes("knit") || 
                         texture.includes("tricotado") || texture.includes("knit") ||
                         category.includes("tricô") || category.includes("malha") || category.includes("suéter");
      
      // Build search queries based on material type
      let exactQuery: string;
      let similarQuery: string;
      
      if (isKnitItem) {
        exactQuery = hasBrand 
          ? `${clothingInfo.brand} suéter tricô ${color} original`
          : `suéter tricô malha ${color} ${clothingInfo.gender || ""} comprar`.trim();
        similarQuery = `suéter tricô ${color} masculino comprar`;
      } else {
        exactQuery = hasBrand 
          ? `${clothingInfo.brand} ${clothingInfo.type} ${color} original`
          : `${clothingInfo.type} ${color} ${clothingInfo.gender || ""} comprar`.trim();
        similarQuery = `${clothingInfo.type} ${color} ${clothingInfo.gender || ""} comprar`.trim();
      }
      
      console.log("Category:", category);
      console.log("Material:", material);
      console.log("Is knit item:", isKnitItem);
      console.log("Exact query:", exactQuery);
      console.log("Similar query:", similarQuery);
      
      const storeMapping: Record<string, string> = {
        "Netshoes": "netshoes.com.br",
        "Dafiti": "dafiti.com.br",
        "Renner": "lojasrenner.com.br",
        "C&A": "cea.com.br",
        "Riachuelo": "riachuelo.com.br",
        "Zara": "zara.com/br",
        "Hering": "hering.com.br",
        "Reserva": "usereserva.com",
        "Nike": "nike.com.br",
        "Adidas": "adidas.com.br",
        "Amazon": "amazon.com.br",
        "Shopee": "shopee.com.br",
        "Mercado Livre": "mercadolivre.com.br",
        "Magazine Luiza": "magazineluiza.com.br",
        "Shein": "shein.com",
        "Youcom": "youcom.com.br",
        "Lacoste": "lacoste.com.br",
        "Osklen": "osklen.com.br",
        "Richards": "richards.com.br",
        "Aramis": "aramis.com.br",
      };

      // Category groups for strict matching
      const knitTerms = ["tricô", "trico", "tricot", "malha", "knit", "suéter", "sueter", "sweater", "pulôver", "pulover", "cardigan", "cardigã"];
      const tshirtTerms = ["camiseta", "t-shirt", "tshirt", "tee"];
      const poloTerms = ["polo", "piquet", "pique"];
      const shirtTerms = ["camisa", "shirt"];

      // Color synonyms
      const colorSynonyms: Record<string, string[]> = {
        "preto": ["preto", "black", "negro"],
        "branco": ["branco", "white", "off-white", "creme", "gelo"],
        "azul": ["azul", "blue"],
        "azul marinho": ["azul marinho", "navy", "azul escuro", "marinho"],
        "vermelho": ["vermelho", "red"],
        "vinho": ["vinho", "bordô", "burgundy", "marsala"],
        "verde": ["verde", "green"],
        "verde musgo": ["verde musgo", "musgo", "verde escuro", "verde militar", "oliva"],
        "cinza": ["cinza", "grey", "gray", "mescla", "grafite"],
        "bege": ["bege", "creme", "nude", "areia", "caramelo", "caqui", "off-white", "marfim", "camel", "kaki"],
        "marrom": ["marrom", "brown", "café", "chocolate", "terra"],
      };
      
      const getColorVariants = (colorStr: string): string[] => {
        const variants: string[] = [colorStr];
        for (const [key, synonyms] of Object.entries(colorSynonyms)) {
          if (colorStr.includes(key) || synonyms.some(s => colorStr.includes(s))) {
            variants.push(...synonyms);
          }
        }
        return [...new Set(variants)];
      };
      
      const colorVariants = getColorVariants(color);
      const brandLower = hasBrand ? clothingInfo.brand.toLowerCase() : "";
      
      const parsePrice = (priceStr: string): number | null => {
        if (!priceStr) return null;
        const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      };
      
      const processResults = (results: any[]) => {
        return results
          .filter((item: any) => {
            if (!item.thumbnail || !item.title) return false;
            
            const itemPrice = parsePrice(item.price || "");
            if (minPrice !== undefined && minPrice !== null && itemPrice !== null && itemPrice < minPrice) return false;
            if (maxPrice !== undefined && maxPrice !== null && itemPrice !== null && itemPrice > maxPrice) return false;
            
            return true;
          })
          .map((item: any) => {
            const title = (item.title || "").toLowerCase();
            const source = (item.source || "").toLowerCase();
            
            // STRICT Category matching
            let categoryScore = 0;
            let categoryMatch = false;
            
            if (isKnitItem) {
              // For knit items - MUST have knit terms
              const hasKnitTerm = knitTerms.some(t => title.includes(t));
              const hasTshirtTerm = tshirtTerms.some(t => title.includes(t));
              
              if (hasKnitTerm) {
                categoryScore = 50;
                categoryMatch = true;
              } else if (hasTshirtTerm) {
                // This is a plain t-shirt, NOT a knit item - reject
                categoryScore = -100;
                categoryMatch = false;
              } else {
                categoryScore = 0;
                categoryMatch = false;
              }
            } else {
              // For non-knit items - match by type
              const typeWords = clothingInfo.type.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
              for (const word of typeWords) {
                if (title.includes(word)) {
                  categoryScore += 20;
                  categoryMatch = true;
                }
              }
            }
            
            // Color matching
            let colorScore = 0;
            let colorMatch = false;
            for (const colorVar of colorVariants) {
              if (title.includes(colorVar)) {
                colorScore = 30;
                colorMatch = true;
                break;
              }
            }
            
            // Brand matching
            let brandScore = 0;
            let isBrandMatch = false;
            if (hasBrand && (title.includes(brandLower) || source.includes(brandLower))) {
              brandScore = 35;
              isBrandMatch = true;
            }
            
            const totalScore = categoryScore + colorScore + brandScore;
            
            const isExact = hasBrand ? isBrandMatch && categoryMatch && colorMatch && totalScore >= 90 : false;
            const isSimilar = categoryMatch && colorMatch && categoryScore >= 30 && totalScore >= 60;
            
            return { item, score: totalScore, isExact, isSimilar, categoryMatch, colorMatch };
          });
      };
      
      const createProduct = (item: any, index: number, score: number, isExact: boolean) => {
        const storeName = item.source || "Loja";
        const productTitle = item.title || exactQuery;
        
        let storeDomain = "";
        for (const [name, domain] of Object.entries(storeMapping)) {
          if (storeName.toLowerCase().includes(name.toLowerCase())) {
            storeDomain = domain;
            break;
          }
        }
        
        let finalLink: string;
        if (item.link && item.link.startsWith('http')) {
          finalLink = item.link;
        } else if (storeDomain) {
          finalLink = `https://www.google.com/search?q=site:${storeDomain}+${encodeURIComponent(productTitle)}&btnI=1`;
        } else {
          finalLink = `https://www.google.com/search?q=${encodeURIComponent(productTitle + " " + storeName + " comprar")}&btnI=1`;
        }
        
        const similarity = isExact 
          ? Math.min(99, 92 + Math.floor(score / 25))
          : Math.min(89, 75 + Math.floor(score / 20));
        
        return {
          id: `product-${isExact ? 'exact' : 'similar'}-${index}`,
          name: storeName,
          productImage: item.thumbnail,
          productName: productTitle,
          priceRange: item.price || "Consulte",
          distance: "Online",
          address: storeName,
          onlineLink: finalLink,
          similarity,
          isExact,
        };
      };
      
      try {
        const searchQueries = [exactQuery, similarQuery];
        let allResults: any[] = [];
        
        for (const query of searchQueries) {
          const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&location=${encodeURIComponent(location || 'São Paulo, Brazil')}&hl=pt&gl=br&num=50&api_key=${SERPAPI_KEY}`;
          
          console.log("Fetching:", query);
          const serpResponse = await fetch(serpUrl);
          const serpData = await serpResponse.json();
          
          if (serpData.shopping_results) {
            allResults = [...allResults, ...serpData.shopping_results];
          }
        }
        
        // Remove duplicates
        const uniqueResults = allResults.filter((item, index, self) => 
          index === self.findIndex(t => t.title === item.title)
        );
        
        console.log(`Total unique results: ${uniqueResults.length}`);
        
        const processed = processResults(uniqueResults);
        
        const matchedCount = processed.filter((r: any) => r.categoryMatch && r.colorMatch).length;
        console.log(`Products with category+color match: ${matchedCount}`);
        
        const exactFiltered = processed
          .filter((r: any) => r.isExact && r.score >= 85)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 4);
        
        const similarFiltered = processed
          .filter((r: any) => r.isSimilar && !r.isExact && r.score >= 60)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 8);
        
        exactProducts = exactFiltered.map((r: any, i: number) => createProduct(r.item, i, r.score, true));
        similarProducts = similarFiltered.map((r: any, i: number) => createProduct(r.item, i, r.score, false));
        
        console.log(`Found ${exactProducts.length} exact and ${similarProducts.length} similar products`);
        
      } catch (e) {
        console.error("SerpAPI error:", e);
      }
    }

    const hasExact = exactProducts.length > 0;
    const hasSimilar = similarProducts.length > 0;

    let message = null;
    if (!hasExact && !hasSimilar) {
      message = "Não encontramos produtos correspondentes ao tipo e cor exatos. Tente uma foto mais clara.";
    } else if (!hasExact && hasSimilar) {
      const brandText = clothingInfo.brand ? ` da marca ${clothingInfo.brand}` : "";
      const materialText = clothingInfo.material ? ` (${clothingInfo.material})` : "";
      message = `Não encontramos a peça exata${brandText}${materialText}, mas encontramos opções do mesmo tipo e cor!`;
    }

    return new Response(JSON.stringify({ 
      analysis: clothingInfo,
      exactProducts,
      similarProducts,
      hasExact,
      hasSimilar,
      message,
      needsApiKey: !SERPAPI_KEY
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro ao analisar imagem" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
