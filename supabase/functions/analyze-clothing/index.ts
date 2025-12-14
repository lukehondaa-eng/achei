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
    const { imageBase64, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing image with AI...");

    // Step 1: Analyze the image with AI to get clothing description
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
            content: `Você é um especialista em moda. Analise a imagem de roupa e retorne APENAS um JSON com:
{
  "type": "tipo da peça (ex: blazer, vestido, calça)",
  "color": "cor principal em português",
  "style": "estilo (ex: casual, formal, esportivo)",
  "material": "material aparente se identificável",
  "details": "detalhes importantes (botões, estampa, corte)",
  "searchQuery": "query otimizada para buscar esta roupa em lojas brasileiras"
}
Responda APENAS com o JSON, sem markdown ou texto adicional.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta roupa e extraia as informações para busca:"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos." }), {
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
      // Clean up potential markdown formatting
      const cleanJson = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      clothingInfo = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      clothingInfo = {
        type: "roupa",
        color: "variada",
        style: "casual",
        searchQuery: "roupa moda"
      };
    }

    // Step 2: Search for similar products using SerpAPI (Google Shopping)
    let products = [];
    
    if (SERPAPI_KEY) {
      console.log("Searching products with SerpAPI...");
      const searchQuery = encodeURIComponent(`${clothingInfo.searchQuery} comprar brasil`);
      const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${searchQuery}&location=${encodeURIComponent(location || 'São Paulo, Brazil')}&hl=pt&gl=br&api_key=${SERPAPI_KEY}`;
      
      try {
        const serpResponse = await fetch(serpUrl);
        const serpData = await serpResponse.json();
        
        console.log("SerpAPI response:", JSON.stringify(serpData.shopping_results?.slice(0, 2)));
        
        if (serpData.shopping_results) {
          products = serpData.shopping_results.slice(0, 8).map((item: any, index: number) => {
            // SerpAPI pode retornar o link em diferentes campos
            const productLink = item.product_link || item.link || item.serpapi_product_api;
            console.log(`Product ${index} link:`, productLink);
            
            return {
              id: `product-${index}`,
              name: item.source || "Loja Online",
              productImage: item.thumbnail || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
              productName: item.title || "Produto Similar",
              priceRange: item.price || "Consulte",
              distance: "Online",
              address: item.source || "Loja Online",
              onlineLink: productLink || `https://www.google.com/search?q=${encodeURIComponent(item.title || clothingInfo.searchQuery)}`,
              similarity: Math.max(70, 95 - (index * 3)),
            };
          });
        }
      } catch (e) {
        console.error("SerpAPI error:", e);
      }
    }

    // If no products found via API, return structured response indicating need for API key
    if (products.length === 0) {
      return new Response(JSON.stringify({ 
        analysis: clothingInfo,
        products: [],
        message: "Para buscar produtos reais, configure a chave SERPAPI_KEY nas configurações do projeto.",
        needsApiKey: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      analysis: clothingInfo,
      products 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Error in analyze-clothing function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro ao analisar imagem" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
