import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LabSettings {
  labName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  gstNumber: string;
  cgstPercent: string;
  sgstPercent: string;
  currency: string;
  pathologistName: string;
  qualification: string;
  regNo: string;
  letterheadColor: string;
  logoBase64: string;
}

const DEFAULT_SETTINGS: LabSettings = {
  labName: "PathLab Pro Diagnostics",
  address: "123, Medical Complex, Near City Hospital",
  city: "Mumbai, Maharashtra 400001",
  phone: "+91 98765 43210",
  email: "info@pathlabpro.com",
  website: "www.pathlabpro.com",
  gstNumber: "27AABCP1234A1Z5",
  cgstPercent: "9",
  sgstPercent: "9",
  currency: "INR",
  pathologistName: "Dr. Sanjay Mehta",
  qualification: "MD (Pathology), PGIMER",
  regNo: "MH-12345",
  letterheadColor: "#1E63B6",
  logoBase64: "",
};

export default function Settings() {
  const [settings, setSettings] = useState<LabSettings>(() => {
    try {
      const saved = localStorage.getItem("labSettings");
      return saved
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
        : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const set = (key: keyof LabSettings, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("logoBase64", reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    localStorage.setItem("labSettings", JSON.stringify(settings));
    toast.success("Settings saved successfully");
  };

  return (
    <div className="space-y-6" data-ocid="settings.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Lab Settings</h2>
          <p className="text-muted-foreground text-sm">
            Configure your lab profile, billing, and report settings
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="bg-primary text-primary-foreground"
          data-ocid="settings.save.button"
        >
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Lab Profile */}
          <Card className="rounded-xl border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lab Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Lab Name</Label>
                <Input
                  value={settings.labName}
                  onChange={(e) => set("labName", e.target.value)}
                  className="mt-1"
                  data-ocid="settings.lab_name.input"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={settings.address}
                  onChange={(e) => set("address", e.target.value)}
                  className="mt-1"
                  data-ocid="settings.address.input"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={settings.city}
                  onChange={(e) => set("city", e.target.value)}
                  className="mt-1"
                  data-ocid="settings.city.input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={settings.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className="mt-1"
                    data-ocid="settings.phone.input"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={settings.email}
                    onChange={(e) => set("email", e.target.value)}
                    className="mt-1"
                    data-ocid="settings.email.input"
                  />
                </div>
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={settings.website}
                  onChange={(e) => set("website", e.target.value)}
                  className="mt-1"
                  data-ocid="settings.website.input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Billing */}
          <Card className="rounded-xl border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>GST Number</Label>
                <Input
                  value={settings.gstNumber}
                  onChange={(e) => set("gstNumber", e.target.value)}
                  className="mt-1"
                  data-ocid="settings.gst.input"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>CGST %</Label>
                  <Input
                    type="number"
                    value={settings.cgstPercent}
                    onChange={(e) => set("cgstPercent", e.target.value)}
                    className="mt-1"
                    data-ocid="settings.cgst.input"
                  />
                </div>
                <div>
                  <Label>SGST %</Label>
                  <Input
                    type="number"
                    value={settings.sgstPercent}
                    onChange={(e) => set("sgstPercent", e.target.value)}
                    className="mt-1"
                    data-ocid="settings.sgst.input"
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input
                    value={settings.currency}
                    onChange={(e) => set("currency", e.target.value)}
                    className="mt-1"
                    data-ocid="settings.currency.input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report */}
          <Card className="rounded-xl border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pathologist / Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pathologist Name</Label>
                <Input
                  value={settings.pathologistName}
                  onChange={(e) => set("pathologistName", e.target.value)}
                  className="mt-1"
                  data-ocid="settings.pathologist.input"
                />
              </div>
              <div>
                <Label>Qualification</Label>
                <Input
                  value={settings.qualification}
                  onChange={(e) => set("qualification", e.target.value)}
                  className="mt-1"
                  data-ocid="settings.qualification.input"
                />
              </div>
              <div>
                <Label>Registration No.</Label>
                <Input
                  value={settings.regNo}
                  onChange={(e) => set("regNo", e.target.value)}
                  className="mt-1"
                  data-ocid="settings.reg_no.input"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Branding */}
          <Card className="rounded-xl border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Logo Upload</Label>
                <div className="mt-2 flex items-center gap-4">
                  {settings.logoBase64 ? (
                    <img
                      src={settings.logoBase64}
                      alt="Lab Logo"
                      className="h-16 w-16 object-contain rounded border border-border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                      No Logo
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="text-sm"
                    data-ocid="settings.logo.upload_button"
                  />
                </div>
              </div>
              <div>
                <Label>Letterhead Color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    value={settings.letterheadColor}
                    onChange={(e) => set("letterheadColor", e.target.value)}
                    className="h-9 w-16 rounded border border-border cursor-pointer"
                    data-ocid="settings.color.input"
                  />
                  <Input
                    value={settings.letterheadColor}
                    onChange={(e) => set("letterheadColor", e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="rounded-xl border border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Report Header Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border border-border">
                <div
                  className="px-5 py-4 text-white"
                  style={{ backgroundColor: settings.letterheadColor }}
                >
                  <div className="flex items-center gap-3">
                    {settings.logoBase64 ? (
                      <img
                        src={settings.logoBase64}
                        alt="logo"
                        className="h-12 w-12 object-contain rounded bg-white/20 p-1"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-white/20 flex items-center justify-center text-white/60 text-xs">
                        Logo
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-lg leading-tight">
                        {settings.labName || "Lab Name"}
                      </p>
                      <p className="text-white/80 text-xs">
                        {settings.address}
                      </p>
                      <p className="text-white/80 text-xs">{settings.city}</p>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-3 bg-white">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>📞 {settings.phone}</span>
                    <span>✉ {settings.email}</span>
                    <span>🌐 {settings.website}</span>
                  </div>
                </div>
                <Separator />
                <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">
                      {settings.pathologistName}
                    </p>
                    <p className="text-muted-foreground">
                      {settings.qualification}
                    </p>
                    <p className="text-muted-foreground">
                      Reg. {settings.regNo}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <p>GST: {settings.gstNumber}</p>
                    <p>
                      CGST: {settings.cgstPercent}% | SGST:{" "}
                      {settings.sgstPercent}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
