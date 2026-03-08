import { useEffect, useState } from "react";
import { Save, Eye, Mail, Code, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/admin/AdminLayout";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  body_html: string;
  description: string | null;
  available_variables: { key: string; label: string }[];
  is_active: boolean;
}

const AdminEmailTemplates = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [editMode, setEditMode] = useState<"visual" | "html">("visual");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("created_at");

    if (error) {
      toast({ title: "Error loading templates", description: error.message, variant: "destructive" });
    } else {
      setTemplates((data as any[]).map((t) => ({
        ...t,
        available_variables: Array.isArray(t.available_variables) ? t.available_variables : [],
      })));
    }
    setLoading(false);
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    setSaving(true);

    const { error } = await supabase
      .from("email_templates")
      .update({
        subject: editingTemplate.subject,
        body_html: editingTemplate.body_html,
        is_active: editingTemplate.is_active,
      })
      .eq("id", editingTemplate.id);

    if (error) {
      toast({ title: "Error saving template", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template saved successfully" });
      fetchTemplates();
    }
    setSaving(false);
  };

  const replaceVariables = (html: string, variables: { key: string; label: string }[]) => {
    let result = html;
    const sampleValues: Record<string, string> = {
      customer_name: "John Doe",
      customer_email: "john@example.com",
      customer_phone: "+91 98765 43210",
      order_number: "DHC-20260308-1234",
      test_names: "Complete Blood Count, Thyroid Profile",
      total_amount: "1,499",
      total_savings: "500",
      preferred_date: "March 10, 2026",
      preferred_time: "Morning (7-9 AM)",
      address: "123, Main Street, Nagercoil Town, Nagercoil, Tamil Nadu - 629001",
      payment_status: "Paid",
      year: new Date().getFullYear().toString(),
    };
    variables.forEach((v) => {
      const regex = new RegExp(`\\{\\{${v.key}\\}\\}`, "g");
      result = result.replace(regex, sampleValues[v.key] || `[${v.label}]`);
    });
    return result;
  };

  if (loading) {
    return (
      <AdminLayout title="Email Templates">
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading templates...</div>
      </AdminLayout>
    );
  }

  if (editingTemplate) {
    return (
      <AdminLayout title={`Edit: ${editingTemplate.name}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setEditingTemplate(null)}>
              ← Back to Templates
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setPreviewTemplate(editingTemplate)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={saveTemplate} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input value={editingTemplate.name} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Template Key</Label>
                  <Input value={editingTemplate.template_key} disabled className="bg-muted font-mono text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={editingTemplate.is_active}
                  onCheckedChange={(checked) =>
                    setEditingTemplate({ ...editingTemplate, is_active: checked })
                  }
                />
                <Label>Template Active</Label>
              </div>
              {editingTemplate.description && (
                <p className="text-sm text-muted-foreground">{editingTemplate.description}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display">Email Subject</CardTitle>
              </div>
              <CardDescription>
                You can use variables like {"{{customer_name}}"} in the subject line
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={editingTemplate.subject}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, subject: e.target.value })
                }
                placeholder="Email subject line..."
              />
              {editingTemplate.available_variables.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="text-xs text-muted-foreground">Click to insert:</span>
                  {editingTemplate.available_variables.map((v) => (
                    <Badge
                      key={v.key}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 text-xs"
                      onClick={() =>
                        setEditingTemplate({
                          ...editingTemplate,
                          subject: editingTemplate.subject + `{{${v.key}}}`,
                        })
                      }
                    >
                      {`{{${v.key}}}`}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display">Email Body</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={editMode === "visual" ? "default" : "outline"}
                    onClick={() => setEditMode("visual")}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Visual
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={editMode === "html" ? "default" : "outline"}
                    onClick={() => setEditMode("html")}
                  >
                    <Code className="h-3.5 w-3.5 mr-1" />
                    HTML
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editMode === "visual" ? (
                <RichTextEditor
                  content={editingTemplate.body_html}
                  onChange={(html) =>
                    setEditingTemplate({ ...editingTemplate, body_html: html })
                  }
                  variables={editingTemplate.available_variables}
                />
              ) : (
                <Textarea
                  value={editingTemplate.body_html}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, body_html: e.target.value })
                  }
                  className="font-mono text-sm min-h-[400px]"
                  placeholder="HTML email content..."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Available Variables</CardTitle>
              <CardDescription>These variables will be replaced with actual data when the email is sent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {editingTemplate.available_variables.map((v) => (
                  <div key={v.key} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                      {`{{${v.key}}}`}
                    </code>
                    <span className="text-sm text-muted-foreground">{v.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Email Preview</DialogTitle>
            </DialogHeader>
            {previewTemplate && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Subject:</strong>{" "}
                    {replaceVariables(previewTemplate.subject, previewTemplate.available_variables)}
                  </p>
                </div>
                <div
                  className="border rounded-lg p-4 bg-white"
                  dangerouslySetInnerHTML={{
                    __html: replaceVariables(previewTemplate.body_html, previewTemplate.available_variables),
                  }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Email Templates">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Manage email templates for order notifications. Use variables like{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{"{{customer_name}}"}</code> to
          personalize emails.
        </p>

        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <h3 className="font-display font-semibold text-lg">{template.name}</h3>
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  )}
                  <p className="text-xs font-mono text-muted-foreground">
                    Key: {template.template_key}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" onClick={() => setEditingTemplate(template)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {templates.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                No email templates found. Default templates will be created automatically.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Email Preview</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Subject:</strong>{" "}
                  {replaceVariables(previewTemplate.subject, previewTemplate.available_variables)}
                </p>
              </div>
              <div
                className="border rounded-lg p-4 bg-white"
                dangerouslySetInnerHTML={{
                  __html: replaceVariables(previewTemplate.body_html, previewTemplate.available_variables),
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminEmailTemplates;
