import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Plus, Clock, Droplets, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Layout from "@/components/layout/Layout";
import { LabTest, ParamGroup } from "@/data/tests";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { getTestImage } from "@/lib/testImages";

const TestDetail = () => {
  const { id } = useParams();
  const { addItem, removeItem, isInCart } = useCart();
  const [test, setTest] = useState<LabTest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("lab_tests")
        .select("*, test_categories(id, name)")
        .eq("id", id)
        .eq("is_active", true)
        .single();
      if (data) {
        // Ensure parameters_grouped is properly parsed
        const parsed = {
          ...data,
          parameters_grouped: Array.isArray(data.parameters_grouped)
            ? data.parameters_grouped
            : typeof data.parameters_grouped === 'string'
              ? JSON.parse(data.parameters_grouped)
              : data.parameters_grouped || [],
        };
        setTest(parsed as LabTest);
      } else {
        setTest(null);
      }
      setLoading(false);
    };
    if (id) fetchTest();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 text-center text-muted-foreground">Loading...</div>
      </Layout>
    );
  }

  if (!test) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Test not found</h1>
          <Link to="/tests"><Button>Back to Tests</Button></Link>
        </div>
      </Layout>
    );
  }

  const inCart = isInCart(test.id);
  const discount = Math.round(((test.original_price - test.price) / test.original_price) * 100);
  const paramGroups: ParamGroup[] = (test.parameters_grouped as ParamGroup[]) || [];
  const hasGroups = paramGroups.length > 0 && paramGroups.some(g => g.tests?.length > 0);
  const totalTests = test.parameters || paramGroups.reduce((sum, g) => sum + (g.count || g.tests.length), 0);

  return (
    <Layout>
      <section className="py-10">
        <div className="container max-w-4xl">
          <Link to="/tests" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Tests
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Test Banner Image */}
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={test.image_url || defaultTestImage}
                  alt={test.name}
                  className="w-full h-48 sm:h-64 object-cover"
                />
              </div>

              <div>
                {test.is_popular && (
                  <Badge className="bg-accent/15 text-accent-foreground border-accent/30 mb-3">⭐ Popular</Badge>
                )}
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">{test.name}</h1>
                {test.test_code && (
                  <p className="text-sm text-muted-foreground font-mono mb-3">Test Code: {test.test_code}</p>
                )}
                <p className="text-muted-foreground leading-relaxed">{test.description}</p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Reports in {test.turnaround || "24-48 hours"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Droplets className="h-4 w-4" />
                  <span>{test.sample_type || "Blood"} sample</span>
                </div>
                {test.fasting_required && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>Fasting required (10-12 hours)</span>
                  </div>
                )}
              </div>

              {/* Grouped parameters with modern accordion */}
              {hasGroups && (
                <Card className="overflow-hidden">
                  <CardHeader className="bg-muted/40 border-b">
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      Tests Included in this Package
                      <Badge className="text-sm font-normal">{totalTests} Tests</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Accordion type="multiple" className="w-full">
                      {paramGroups.map((group, idx) => (
                        <AccordionItem
                          key={idx}
                          value={`group-${idx}`}
                          className="border-b last:border-b-0"
                        >
                          <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3 text-left">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-primary font-bold text-sm">{group.count || group.tests.length}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-foreground">{group.group}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({group.count || group.tests.length} Tests)
                                </span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-5 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-11">
                              {group.tests.map((t, tIdx) => (
                                <div key={tIdx} className="flex items-center gap-2 text-sm py-1">
                                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <span className="text-muted-foreground">{t}</span>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              )}

              {/* Flat parameters fallback */}
              {!hasGroups && test.parameters_list && test.parameters_list.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-display">Parameters Included ({test.parameters || test.parameters_list.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {test.parameters_list.map((param) => (
                        <div key={param} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span>{param}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <Card className="sticky top-24 border-primary/20">
                <CardContent className="p-6 space-y-5">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">₹{test.price}</span>
                      <span className="text-lg text-muted-foreground line-through">₹{test.original_price}</span>
                    </div>
                    <Badge variant="secondary" className="mt-2 text-primary font-medium">
                      {discount}% off — You save ₹{test.original_price - test.price}
                    </Badge>
                  </div>

                  <Button
                    className="w-full rounded-xl"
                    size="lg"
                    variant={inCart ? "outline" : "default"}
                    onClick={() => (inCart ? removeItem(test.id) : addItem(test))}
                  >
                    {inCart ? (
                      <><Check className="h-4 w-4 mr-2" /> Added to Cart</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-2" /> Add to Cart</>
                    )}
                  </Button>

                  {inCart && (
                    <Link to="/cart">
                      <Button className="w-full rounded-xl" variant="secondary" size="lg">Go to Cart</Button>
                    </Link>
                  )}

                  <div className="space-y-2 text-sm text-muted-foreground pt-3 border-t">
                    <p className="flex items-center gap-2">✅ Free home collection</p>
                    <p className="flex items-center gap-2">✅ NABL accredited lab</p>
                    <p className="flex items-center gap-2">✅ Digital reports on email</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TestDetail;
