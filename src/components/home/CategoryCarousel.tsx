import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, icons } from "lucide-react";
import { motion } from "framer-motion";
import { TestCategory } from "@/data/tests";

const pastelGradients = [
  "from-emerald-100 to-teal-50",
  "from-rose-100 to-pink-50",
  "from-sky-100 to-blue-50",
  "from-amber-100 to-yellow-50",
  "from-violet-100 to-purple-50",
  "from-cyan-100 to-teal-50",
  "from-fuchsia-100 to-pink-50",
  "from-lime-100 to-green-50",
  "from-orange-100 to-amber-50",
  "from-indigo-100 to-blue-50",
];

interface CategoryCarouselProps {
  categories: TestCategory[];
}

const CategoryCarousel = ({ categories }: CategoryCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const getCategorySlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll);
    return () => el?.removeEventListener("scroll", checkScroll);
  }, [categories]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -260 : 260, behavior: "smooth" });
  };

  if (categories.length === 0) return null;

  return (
    <section className="py-12 lg:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-2">Browse by Category</h2>
          <p className="text-base lg:text-lg text-muted-foreground">Choose from our wide range of diagnostic tests</p>
        </motion.div>

        <div className="relative group">
          {/* Left arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/90 border shadow-lg flex items-center justify-center hover:bg-background transition-all opacity-0 group-hover:opacity-100 -translate-x-1/2"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
          )}

          {/* Scrollable row */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((cat, idx) => (
              <Link
                key={cat.id}
                to={`/tests?category=${getCategorySlug(cat.name)}`}
                className="snap-start"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className={`flex-shrink-0 w-[150px] sm:w-[170px] h-[170px] sm:h-[190px] rounded-2xl bg-gradient-to-br ${pastelGradients[idx % pastelGradients.length]} flex flex-col items-center justify-center gap-3 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-border/50 group/card`}
                >
                  <span className="text-5xl sm:text-6xl group-hover/card:scale-110 transition-transform duration-300 drop-shadow-sm">
                    {cat.icon}
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-foreground text-center px-3 leading-tight">
                    {cat.name}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Right arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/90 border shadow-lg flex items-center justify-center hover:bg-background transition-all opacity-0 group-hover:opacity-100 translate-x-1/2"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoryCarousel;
