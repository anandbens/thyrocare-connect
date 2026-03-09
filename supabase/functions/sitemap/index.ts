import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/xml; charset=utf-8",
};

const SITE_URL = "https://test-fairy-hub.lovable.app";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { data: tests } = await supabase
    .from("lab_tests")
    .select("id, updated_at")
    .eq("is_active", true);

  const { data: categories } = await supabase
    .from("test_categories")
    .select("name")
    .eq("is_active", true);

  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/tests", priority: "0.9", changefreq: "daily" },
    { loc: "/about", priority: "0.6", changefreq: "monthly" },
    { loc: "/contact", priority: "0.6", changefreq: "monthly" },
  ];

  const categoryPages = (categories || []).map((c) => ({
    loc: `/tests?category=${c.name.toLowerCase().replace(/\s+/g, "-")}`,
    priority: "0.8",
    changefreq: "weekly",
  }));

  const testPages = (tests || []).map((t) => ({
    loc: `/tests/${t.id}`,
    priority: "0.7",
    changefreq: "weekly",
    lastmod: t.updated_at?.split("T")[0],
  }));

  const allPages = [...staticPages, ...categoryPages, ...testPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>${p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : ""}
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
