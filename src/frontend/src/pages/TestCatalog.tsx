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
import { Skeleton } from "@/components/ui/skeleton";
import { FlaskConical, Loader2, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useAddTestCatalog,
  useSeedTestCatalog,
  useTestCatalog,
  useUpdateTestPrice,
  useUpdateTestRange,
} from "../hooks/useQueries";
import { SAMPLE_TEST_CATALOG } from "../lib/constants";

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

export default function TestCatalog() {
  const { data: tests, isLoading } = useTestCatalog();
  const addTest = useAddTestCatalog();
  const seedTests = useSeedTestCatalog();
  const updatePrice = useUpdateTestPrice();
  const updateRange = useUpdateTestRange();
  const [open, setOpen] = useState(false);
  const [seeded, setSeeded] = useState(false);
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

  // Seed on first load
  useEffect(() => {
    if (!isLoading && tests && tests.length === 0 && !seeded) {
      setSeeded(true);
      seedTests.mutate(SAMPLE_TEST_CATALOG, {
        onSuccess: () =>
          toast.success("Test catalog loaded with all standard tests!"),
        onError: () =>
          toast.error("Could not load test catalog. Please try again."),
      });
    }
  }, [isLoading, tests, seeded, seedTests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addTest.mutateAsync({
        code: form.code.toUpperCase(),
        name: form.name,
        unit: form.unit,
        referenceRange: form.referenceRange,
        price: BigInt(form.price || 0),
        sampleType: form.sampleType,
      });
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
    } catch {
      toast.error("Failed to add test.");
    }
  };

  const handleSavePrice = async (code: string) => {
    try {
      await updatePrice.mutateAsync({
        code,
        price: BigInt(editPrice || 0),
      });
      toast.success("Price updated!");
      setEditingCode(null);
      setEditPrice("");
    } catch {
      toast.error("Failed to update price.");
    }
  };

  const filteredTests = (tests ?? []).filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sampleType.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSaveRange = async (test: (typeof filteredTests)[0]) => {
    try {
      await updateRange.mutateAsync({
        test: { ...test, price: test.price },
        referenceRange: editRange,
      });
      toast.success("Normal range updated!");
      setEditingRangeCode(null);
      setEditRange("");
    } catch {
      toast.error("Failed to update range.");
    }
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
                      setForm((p) => ({ ...p, referenceRange: e.target.value }))
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
                <Button
                  type="submit"
                  disabled={addTest.isPending}
                  data-ocid="catalog.submit_button"
                >
                  {addTest.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Add Test
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Available Tests
              <Badge variant="secondary">{tests?.length ?? 0}</Badge>
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
          {isLoading || seedTests.isPending ? (
            <div className="space-y-2" data-ocid="catalog.loading_state">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
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
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
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
                                if (e.key === "Enter") handleSaveRange(test);
                                if (e.key === "Escape") {
                                  setEditingRangeCode(null);
                                  setEditRange("");
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleSaveRange(test)}
                              disabled={updateRange.isPending}
                            >
                              {updateRange.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Save"
                              )}
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
                              {test.referenceRange ? (
                                test.referenceRange
                              ) : (
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
                                if (e.key === "Enter")
                                  handleSavePrice(test.code);
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
                              disabled={updatePrice.isPending}
                            >
                              {updatePrice.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Save"
                              )}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
