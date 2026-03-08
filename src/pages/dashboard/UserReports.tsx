import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

const UserReports = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <section className="py-10">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
            <h1 className="text-2xl font-display font-bold text-foreground">My Reports</h1>
          </div>

          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="font-display font-semibold text-lg text-foreground mb-2">No reports available yet</p>
              <p className="text-sm max-w-md mx-auto">
                Your lab reports will appear here once your tests are processed. Reports are usually available within 24-48 hours of sample collection.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default UserReports;
