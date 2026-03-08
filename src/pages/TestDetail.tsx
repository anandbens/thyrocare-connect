import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, Plus, Clock, Droplets, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { tests } from "@/data/tests";
import { useCart } from "@/context/CartContext";

const TestDetail = () => {
  const { id } = useParams();
  const test = tests.find((t) => t.id === id);
  const { addItem, removeItem, isInCart } = useCart();

  if (!test) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Test not found</h1>
          <Link to="/tests">
            <Button>Back to Tests</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const inCart = isInCart(test.id);
  const discount = Math.round(((test.originalPrice - test.price) / test.originalPrice) * 100);

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
              <div>
                {test.popular && (
                  <Badge className="bg-accent/15 text-accent-foreground border-accent/30 mb-3">⭐ Popular</Badge>
                )}
                <h1 className="text-3xl font-display font-bold text-foreground mb-3">{test.name}</h1>
                <p className="text-muted-foreground leading-relaxed">{test.description}</p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Reports in {test.turnaround}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Droplets className="h-4 w-4" />
                  <span>{test.sampleType} sample</span>
                </div>
                {test.fasting && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>Fasting required (10-12 hours)</span>
                  </div>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-display">Parameters Included ({test.parameters})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {test.parametersList.map((param) => (
                      <div key={param} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span>{param}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pricing sidebar */}
            <div>
              <Card className="sticky top-24 border-primary/20">
                <CardContent className="p-6 space-y-5">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">₹{test.price}</span>
                      <span className="text-lg text-muted-foreground line-through">₹{test.originalPrice}</span>
                    </div>
                    <Badge variant="secondary" className="mt-2 text-primary font-medium">
                      {discount}% off — You save ₹{test.originalPrice - test.price}
                    </Badge>
                  </div>

                  <Button
                    className="w-full rounded-xl"
                    size="lg"
                    variant={inCart ? "outline" : "default"}
                    onClick={() => (inCart ? removeItem(test.id) : addItem(test))}
                  >
                    {inCart ? (
                      <>
                        <Check className="h-4 w-4 mr-2" /> Added to Cart
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" /> Add to Cart
                      </>
                    )}
                  </Button>

                  {inCart && (
                    <Link to="/cart">
                      <Button className="w-full rounded-xl" variant="secondary" size="lg">
                        Go to Cart
                      </Button>
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
