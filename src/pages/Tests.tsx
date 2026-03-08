import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import TestCard from "@/components/TestCard";
import { tests, categories } from "@/data/tests";

const Tests = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const activeCategory = searchParams.get("category") || "all";

  const filtered = useMemo(() => {
    let result = tests;
    if (activeCategory !== "all") {
      result = result.filter((t) => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.parametersList.some((p) => p.toLowerCase().includes(q))
      );
    }
    return result;
  }, [activeCategory, search]);

  const setCategory = (cat: string) => {
    if (cat === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", cat);
    }
    setSearchParams(searchParams);
  };

  return (
    <Layout>
      <section className="py-10">
        <div className="container">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              {activeCategory !== "all"
                ? categories.find((c) => c.id === activeCategory)?.name || "All Tests"
                : "All Tests & Packages"}
            </h1>
            <p className="text-muted-foreground">
              Browse and book from our comprehensive range of diagnostic tests
            </p>
          </div>

          {/* Search & Filters */}
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

          {/* Category chips */}
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
                variant={activeCategory === cat.id ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setCategory(cat.id)}
              >
                {cat.icon} {cat.name}
              </Button>
            ))}
          </div>

          {/* Results */}
          {filtered.length > 0 ? (
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
