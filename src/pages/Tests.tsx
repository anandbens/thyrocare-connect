import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import TestCard from "@/components/TestCard";
import { supabase } from "@/integrations/supabase/client";
import { LabTest, TestCategory } from "@/data/tests";

const Tests = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [tests, setTests] = useState<LabTest[]>([]);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const activeCategory = searchParams.get("category") || "all";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [testsRes, catsRes] = await Promise.all([
        supabase.from("lab_tests").select("*, test_categories(id, name)").eq("is_active", true).order("created_at"),
        supabase.from("test_categories").select("*").eq("is_active", true).order("sort_order"),
      ]);
      setTests((testsRes.data as any[]) || []);
      setCategories((catsRes.data as any[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let result = tests;
    if (activeCategory !== "all") {
      const matchingCat = categories.find((c) => c.name.toLowerCase().replace(/\s+/g, "-") === activeCategory);
      if (matchingCat) {
        result = result.filter((t) => t.category_id === matchingCat.id);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          (t.parameters_list || []).some((p) => p.toLowerCase().includes(q))
      );
    }
    return result;
  }, [activeCategory, search, tests, categories]);

  const setCategory = (cat: string) => {
    if (cat === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", cat);
    }
    setSearchParams(searchParams);
  };

  const getCategorySlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

  // Dynamic SEO for tests page
  useEffect(() => {
    const catName = activeCategory !== "all"
      ? categories.find((c) => getCategorySlug(c.name) === activeCategory)?.name
      : null;
    const title = catName
      ? `${catName} Tests in Nagercoil - Book Online | Thyrocare Nagercoil`
      : "All Blood Tests & Health Packages in Nagercoil | Thyrocare - Book Online";
    const desc = catName
      ? `Book affordable ${catName.toLowerCase()} tests online in Nagercoil & Kanyakumari district. Free home collection, NABL accredited lab, reports in 24-48 hrs.`
      : "Browse 500+ affordable blood tests & health packages in Nagercoil. Thyrocare authorized centre with free home sample collection across Kanyakumari district.";
    document.title = title;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute("content", desc);
    return () => { document.title = "Thyrocare Nagercoil | Book Blood Tests Online - Home Collection"; };
  }, [activeCategory, categories]);

  return (
    <Layout>
      <section className="py-10">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              {activeCategory !== "all"
                ? categories.find((c) => getCategorySlug(c.name) === activeCategory)?.name || "All Tests"
                : "Blood Tests & Health Packages in Nagercoil"}
            </h1>
            <p className="text-muted-foreground">
              Browse and book affordable diagnostic tests with free home collection in Kanyakumari district
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tests, packages, or parameters..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              size="sm"
              variant={activeCategory === "all" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setCategory("all")}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={activeCategory === getCategorySlug(cat.name) ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setCategory(getCategorySlug(cat.name))}
              >
                {cat.icon} {cat.name}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20 text-muted-foreground">Loading tests...</div>
          ) : filtered.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {filtered.length} test{filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((test, i) => (
                  <TestCard key={test.id} test={test} index={i} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-lg text-muted-foreground">No tests found matching your criteria.</p>
              <Button variant="ghost" className="mt-4" onClick={() => { setSearch(""); setCategory("all"); }}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Tests;
