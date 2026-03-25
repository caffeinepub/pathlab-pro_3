import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, Printer, Receipt } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PaymentStatus } from "../backend";
import type { Bill } from "../backend.d";
import {
  useBills,
  useCreateBill,
  useTestCatalog,
  useUpdatePaymentStatus,
} from "../hooks/useQueries";
import { CGST_RATE, GST_RATE, LAB_INFO, SGST_RATE } from "../lib/constants";

function InvoiceDialog({
  bill,
  open,
  onClose,
  patientName,
}: {
  bill: Bill | null;
  open: boolean;
  onClose: () => void;
  patientName: string;
}) {
  const { data: catalog } = useTestCatalog();

  if (!bill) return null;

  const subtotal = Number(bill.totalAmount) - Number(bill.gstAmount);
  const cgst = subtotal * CGST_RATE;
  const sgst = subtotal * SGST_RATE;
  const invoiceDate = new Date(
    Number(bill.timestamp) / 1_000_000,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // catalog is available for future test detail lookup
  void catalog;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-ocid="billing.dialog"
      >
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center justify-between">
            <span>GST Invoice</span>
            <Button
              size="sm"
              onClick={() => window.print()}
              className="mr-6"
              data-ocid="billing.primary_button"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6 bg-white text-gray-900">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-blue-900 pb-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/generated/pathlab-logo-transparent.dim_120x120.png"
                alt="Logo"
                className="h-14 w-14"
              />
              <div>
                <h1 className="text-xl font-bold text-blue-900">
                  {LAB_INFO.name}
                </h1>
                <p className="text-xs text-gray-600">{LAB_INFO.address}</p>
                <p className="text-xs text-gray-600">
                  GST No: {LAB_INFO.gstNo}
                </p>
                <p className="text-xs text-gray-600">{LAB_INFO.phone}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-900">TAX INVOICE</p>
              <p className="text-sm">
                Invoice #: INV-{bill.reportId.toString().padStart(6, "0")}
              </p>
              <p className="text-sm">Date: {invoiceDate}</p>
              <Badge
                className={`text-xs mt-1 ${
                  bill.paymentStatus === PaymentStatus.paid
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {bill.paymentStatus.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Bill To */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
              Bill To
            </p>
            <p className="font-semibold">{patientName}</p>
            <p className="text-sm text-gray-600">
              Report ID: #{bill.reportId.toString()}
            </p>
          </div>

          {/* Line Items */}
          <div>
            <table className="w-full text-sm border border-gray-200">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="text-left py-2 px-3">#</th>
                  <th className="text-left py-2 px-3">Description</th>
                  <th className="text-right py-2 px-3">Qty</th>
                  <th className="text-right py-2 px-3">Rate (₹)</th>
                  <th className="text-right py-2 px-3">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {bill.lineItems.map((item, i) => (
                  <tr
                    key={`${item.testName}-${i}`}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="py-2 px-3">{i + 1}</td>
                    <td className="py-2 px-3">{item.testName}</td>
                    <td className="py-2 px-3 text-right">1</td>
                    <td className="py-2 px-3 text-right">
                      {Number(item.price).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {Number(item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  CGST @{(CGST_RATE * 100).toFixed(0)}%
                </span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  SGST @{(SGST_RATE * 100).toFixed(0)}%
                </span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Grand Total</span>
                <span className="text-blue-900">
                  ₹{Number(bill.totalAmount).toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                GST Rate: {(GST_RATE * 100).toFixed(0)}% (CGST{" "}
                {(CGST_RATE * 100).toFixed(0)}% + SGST{" "}
                {(SGST_RATE * 100).toFixed(0)}%)
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 border-t pt-3">
            Thank you for choosing {LAB_INFO.name}. This is a computer-generated
            invoice.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateBillDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: catalog } = useTestCatalog();
  const createBill = useCreateBill();
  const [reportIdStr, setReportIdStr] = useState("");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  const toggleTest = (code: string) => {
    setSelectedTests((p) =>
      p.includes(code) ? p.filter((c) => c !== code) : [...p, code],
    );
  };

  const subtotal = (catalog ?? [])
    .filter((t) => selectedTests.includes(t.code))
    .reduce((s, t) => s + Number(t.price), 0);
  const gstAmt = subtotal * GST_RATE;
  const total = subtotal + gstAmt;

  const handleCreate = async () => {
    if (!reportIdStr) {
      toast.error("Enter report ID");
      return;
    }
    if (selectedTests.length === 0) {
      toast.error("Select at least one test");
      return;
    }
    const lineItems = (catalog ?? [])
      .filter((t) => selectedTests.includes(t.code))
      .map((t) => ({
        testName: t.name,
        price: t.price,
      }));
    try {
      await createBill.mutateAsync({
        reportId: BigInt(reportIdStr),
        lineItems,
      });
      toast.success("Bill created!");
      onClose();
      setReportIdStr("");
      setSelectedTests([]);
    } catch {
      toast.error("Failed to create bill.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-ocid="billing.modal">
        <DialogHeader>
          <DialogTitle>Create New Bill</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="bill-report-id">Report ID *</Label>
            <Input
              id="bill-report-id"
              placeholder="Enter Report ID (number)"
              value={reportIdStr}
              onChange={(e) => setReportIdStr(e.target.value)}
              type="number"
              data-ocid="billing.input"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Select Tests *</p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {(catalog ?? []).map((test) => (
                <label
                  key={test.code}
                  htmlFor={`bill-test-${test.code}`}
                  className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-xs ${
                    selectedTests.includes(test.code)
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <input
                    id={`bill-test-${test.code}`}
                    type="checkbox"
                    checked={selectedTests.includes(test.code)}
                    onChange={() => toggleTest(test.code)}
                  />
                  <span>{test.name}</span>
                  <span className="ml-auto text-muted-foreground">
                    ₹{Number(test.price)}
                  </span>
                </label>
              ))}
            </div>
          </div>
          {selectedTests.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST 18%</span>
                <span>₹{gstAmt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-ocid="billing.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={createBill.isPending}
              data-ocid="billing.confirm_button"
            >
              {createBill.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Bill
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Billing() {
  const { data: bills, isLoading } = useBills();
  const updateStatus = useUpdatePaymentStatus();
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const getPatientName = (reportId: bigint) => {
    return `Report #${reportId.toString()}`;
  };

  const handleStatusUpdate = async (billId: bigint, status: PaymentStatus) => {
    try {
      await updateStatus.mutateAsync({ billId, status });
      toast.success("Payment status updated!");
    } catch {
      toast.error("Failed to update status.");
    }
  };

  return (
    <div className="space-y-6" data-ocid="billing.page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Billing</h2>
          <p className="text-muted-foreground text-sm">
            Manage invoices with GST calculation
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          data-ocid="billing.open_modal_button"
        >
          <Receipt className="h-4 w-4 mr-2" />
          Create Bill
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            All Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2" data-ocid="billing.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="billing.table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Invoice
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Report ID
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Tests
                    </th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                      GST
                    </th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                      Total
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Status
                    </th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(bills ?? []).map((bill, idx) => (
                    <tr
                      key={`${bill.reportId}-${bill.timestamp}`}
                      className="border-b border-border/50 hover:bg-muted/30"
                      data-ocid={`billing.item.${idx + 1}`}
                    >
                      <td className="py-2.5 px-3 font-mono text-xs">
                        INV-{bill.reportId.toString().padStart(6, "0")}
                      </td>
                      <td className="py-2.5 px-3">
                        #{bill.reportId.toString()}
                      </td>
                      <td className="py-2.5 px-3">
                        {bill.lineItems.length} test(s)
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        ₹{Number(bill.gstAmount).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold">
                        ₹{Number(bill.totalAmount).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            bill.paymentStatus === PaymentStatus.paid
                              ? "default"
                              : "secondary"
                          }
                          className={`text-xs ${
                            bill.paymentStatus === PaymentStatus.paid
                              ? "bg-green-100 text-green-800"
                              : bill.paymentStatus === PaymentStatus.unpaid
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {bill.paymentStatus === PaymentStatus.paid ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {bill.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setViewBill(bill)}
                            data-ocid={`billing.edit_button.${idx + 1}`}
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Invoice
                          </Button>
                          {bill.paymentStatus !== PaymentStatus.paid && (
                            <Select
                              onValueChange={(v) =>
                                handleStatusUpdate(
                                  bill.reportId,
                                  v as PaymentStatus,
                                )
                              }
                            >
                              <SelectTrigger
                                className="h-7 w-28 text-xs"
                                data-ocid="billing.select"
                              >
                                <SelectValue placeholder="Update" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={PaymentStatus.paid}>
                                  Mark Paid
                                </SelectItem>
                                <SelectItem value={PaymentStatus.partial}>
                                  Partial
                                </SelectItem>
                                <SelectItem value={PaymentStatus.unpaid}>
                                  Unpaid
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(bills ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                        data-ocid="billing.empty_state"
                      >
                        No bills yet. Create a bill from a report.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceDialog
        bill={viewBill}
        open={!!viewBill}
        onClose={() => setViewBill(null)}
        patientName={viewBill ? getPatientName(viewBill.reportId) : ""}
      />
      <CreateBillDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
