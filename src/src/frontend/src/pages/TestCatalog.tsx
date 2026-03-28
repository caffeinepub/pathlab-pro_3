import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FlaskConical, Pencil, Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SAMPLE_TEST_CATALOG } from "../lib/constants";

const STORAGE_KEY = "pathlab_test_catalog_overrides";
const CUSTOM_TESTS_KEY = "pathlab_custom_tests";

const SAMPLE_TYPES = [
  "Blood (Serum)",
  "Blood (EDTA)",
  "Blood (Whole)",
  "Urine",
  "Stool",
  "Sputum",
  "Swab",
  "CSF",
  "Other",
];

type TestItem = {
  code: string;
  name: string;
  unit: string;
  referenceRange: string;
  price: bigint;
  sampleType: string;
};

type Overrides = Record<string, { price?: number; referenceRange?: string }>;

function getSampleTypeBadgeClass(sampleType: string): string {
  const lower = sampleType.toLowerCase();
  if (lower.includes("blood"))
    return "bg-blue-100 text-blue-700 border-blue-200";
  if (lower.includes("urine"))
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (lower.includes("stool"))
    return "bg-green-100 text-green-700 border-green-200";
  if (lower.includes("sputum"))
    return "bg-orange-100 text-orange-700 border-orange-200";
  if (lower.includes("swab"))
    return "bg-purple-100 text-purple-700 border-purple-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

function loadOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function loadCustomTests(): TestItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((t: TestItem & { price: number }) => ({
      ...t,
      price: BigInt(t.price),
    }));
  } catch {
    return [];
  }
}

function saveCustomTests(tests: TestItem[]) {
  localStorage.setItem(
    CUSTOM_TESTS_KEY,
    JSON.stringify(tests.map((t) => ({ ...t, price: Number(t.price) }))),
  );
}

export default function TestCatalog() {
  const [overrides, setOverrides] = useState<Overrides>(loadOverrides);
  const [customTests, setCustomTests] = useState<TestItem[]>(loadCustomTests);
  const [open, setOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editingRangeCode, setEditingRangeCode] = useState<string | null>(null);
  const [editRange, setEditRange] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    code: "",
    name: "",
    unit: "",
    referenceRange: "",
    price: "",
    sampleType: "",
  });

  // Merge standard tests with overrides and custom tests
  const allTests: TestItem[] = useMemo(() => {
    const standard = SAMPLE_TEST_CATALOG.map((t) => ({
      ...t,
      price:
        overrides[t.code]?.price !== undefined
          ? BigInt(overrides[t.code].price!)
          : t.price,
      referenceRange: overrides[t.code]?.referenceRange ?? t.referenceRange,
    }));
    return [...standard, ...customTests];
  }, [overrides, customTests]);

  const filteredTests = useMemo(
    () =>
      allTests.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.sampleType.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [allTests, searchQuery],
  );

  // Sync to localStorage whenever state changes
  useEffect(() => {
    saveOverrides(overrides);
  }, [overrides]);
  useEffect(() => {
    saveCustomTests(customTests);
  }, [customTests]);

  const handleSavePrice = (code: string) => {
    const newPrice = Number.parseInt(editPrice || "0", 10);
    const isCustom = customTests.some((t) => t.code === code);
    if (isCustom) {
      setCustomTests((prev) =>
        prev.map((t) =>
          t.code === code ? { ...t, price: BigInt(newPrice) } : t,
        ),
      );
    } else {
      setOverrides((prev) => ({
        ...prev,
        [code]: { ...prev[code], price: newPrice },
      }));
    }
    toast.success("Price updated!");
    setEditingCode(null);
    setEditPrice("");
  };

  const handleSaveRange = (code: string, currentRange: string) => {
    const newRange = editRange || currentRange;
    const isCustom = customTests.some((t) => t.code === code);
    if (isCustom) {
      setCustomTests((prev) =>
        prev.map((t) =>
          t.code === code ? { ...t, referenceRange: newRange } : t,
        ),
      );
    } else {
      setOverrides((prev) => ({
        ...prev,
        [code]: { ...prev[code], referenceRange: newRange },
      }));
    }
    toast.success("Normal range updated!");
    setEditingRangeCode(null);
    setEditRange("");
  };

  const handleReload = () => {
    setOverrides({});
    saveOverrides({});
    toast.success("Standard tests reloaded with default prices and ranges!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.code.toUpperCase().trim();
    if (!code || !form.name || !form.sampleType) {
      toast.error("Code, Name, and Sample Type are required.");
      return;
    }
    const existing = allTests.some((t) => t.code === code);
    if (existing) {
      toast.error("A test with this code already exists.");
      return;
    }
    const newTest: TestItem = {
      code,
      name: form.name.trim(),
      unit: form.unit.trim(),
      referenceRange: form.referenceRange.trim(),
      price: BigInt(Number.parseInt(form.price || "0", 10)),
      sampleType: form.sampleType,
    };
    setCustomTests((prev) => [...prev, newTest]);
    toast.success("Test added to catalog!");
    setOpen(false);
    setForm({
      code: "",
      name: "",
      unit: "",
      referenceRange: "",
      price: "",
      sampleType: "",
    });
  };

  return (
    <div className="space-y-6" data-ocid="catalog.page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Test Catalog</h2>
          <p className="text-muted-foreground text-sm">
            Manage available diagnostic tests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReload}
            data-ocid="catalog.secondary_button"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Standard Tests
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-ocid="catalog.open_modal_button">
                <Plus className="h-4 w-4 mr-2" />
                Add Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" data-ocid="catalog.dialog">
              <DialogHeader>
                <DialogTitle>Add New Test</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="code">Test Code *</Label>
                    <Input
                      id="code"
                      value={form.code}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, code: e.target.value }))
                      }
                      placeholder="e.g. CBC"
                      required
                      data-ocid="catalog.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, price: e.target.value }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="tname">Test Name *</Label>
                    <Input
                      id="tname"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Complete Blood Count"
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="sampleType">Sample Type *</Label>
                    <Select
                      value={form.sampleType}
                      onValueChange={(val) =>
                        setForm((p) => ({ ...p, sampleType: val }))
                      }
                    >
                      <SelectTrigger id="sampleType" data-ocid="catalog.select">
                        <SelectValue placeholder="Select sample type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SAMPLE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={form.unit}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, unit: e.target.value }))
                      }
                      placeholder="mg/dL"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="refrange">Reference Range</Label>
                    <Input
                      id="refrange"
                      value={form.referenceRange}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          referenceRange: e.target.value,
                        }))
                      }
                      placeholder="70-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    data-ocid="catalog.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" data-ocid="catalog.submit_button">
                    Add Test
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Available Tests
              <Badge variant="secondary">{allTests.length}</Badge>
            </CardTitle>
            <Input
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs h-8 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="catalog.table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Code
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Test Name
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Sample Type
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Unit
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Normal Range
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Price (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test, idx) => (
                  <tr
                    key={test.code}
                    className="border-b border-border/50 hover:bg-muted/30"
                    data-ocid={`catalog.item.${idx + 1}`}
                  >
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        {test.code}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-medium">{test.name}</td>
                    <td className="py-2.5 px-3">
                      {test.sampleType ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getSampleTypeBadgeClass(test.sampleType)}`}
                        >
                          {test.sampleType}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {test.unit}
                    </td>
                    <td className="py-2.5 px-3">
                      {editingRangeCode === test.code ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editRange}
                            onChange={(e) => setEditRange(e.target.value)}
                            className="h-7 w-28 text-sm"
                            autoFocus
                            placeholder="e.g. < 5"
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleSaveRange(test.code, test.referenceRange);
                              if (e.key === "Escape") {
                                setEditingRangeCode(null);
                                setEditRange("");
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                              handleSaveRange(test.code, test.referenceRange)
                            }
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setEditingRangeCode(null);
                              setEditRange("");
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span className="text-muted-foreground text-xs">
                            {test.referenceRange || (
                              <span className="italic">Set range</span>
                            )}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setEditingRangeCode(test.code);
                              setEditRange(test.referenceRange);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {editingCode === test.code ? (
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            min={0}
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="h-7 w-24 text-sm text-right"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSavePrice(test.code);
                              if (e.key === "Escape") {
                                setEditingCode(null);
                                setEditPrice("");
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleSavePrice(test.code)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setEditingCode(null);
                              setEditPrice("");
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 group">
                          <span className="font-semibold">
                            {Number(test.price) === 0 ? (
                              <span className="text-muted-foreground text-xs italic">
                                Set price
                              </span>
                            ) : (
                              `₹${Number(test.price)}`
                            )}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setEditingCode(test.code);
                              setEditPrice(String(Number(test.price)));
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredTests.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                      data-ocid="catalog.empty_state"
                    >
                      {searchQuery
                        ? "No matching tests found."
                        : "No tests found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
