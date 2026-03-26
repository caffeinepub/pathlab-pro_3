import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { CheckCircle, Clock, Loader2, Printer, Receipt } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PaymentStatus } from "../backend";
import type { Bill } from "../backend.d";
import {
  useBills,
  useCreateBill,
  usePatientReports,
  usePatients,
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

  const handlePrint = () => {
    const printContent = document.getElementById("invoice-print")?.innerHTML;
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${patientName}</title><style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 16px; }
      .header-left { display: flex; align-items: center; gap: 12px; }
      .logo { width: 56px; height: 56px; }
      .lab-name { font-size: 1.2rem; font-weight: bold; color: #1e3a5f; }
      .lab-sub { font-size: 0.75rem; color: #555; }
      .header-right { text-align: right; }
      .bill-to { background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
      .label { font-size: 0.7rem; text-transform: uppercase; font-weight: 600; color: #888; }
      table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin-bottom: 16px; }
      th { background: #1e3a5f; color: white; text-align: left; padding: 8px 12px; }
      th:last-child, td:last-child { text-align: right; }
      td { padding: 8px 12px; border: 1px solid #e5e7eb; }
      tr:nth-child(even) td { background: #f9fafb; }
      .totals { float: right; width: 240px; font-size: 0.875rem; }
      .totals div { display: flex; justify-content: space-between; margin-bottom: 4px; }
      .grand-total { font-weight: bold; font-size: 1rem; color: #1e3a5f; border-top: 1px solid #ccc; padding-top: 8px; margin-top: 4px; }
      .footer { clear: both; text-align: center; font-size: 0.75rem; color: #aaa; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 24px; }
    </style></head><body>${printContent}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-ocid="billing.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>GST Invoice</span>
            <Button
              size="sm"
              onClick={handlePrint}
              className="mr-6"
              data-ocid="billing.primary_button"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div
          id="invoice-print"
          className="p-6 space-y-6 bg-white text-gray-900"
        >
          {/* Header */}
          <div className="header flex items-start justify-between border-b-2 border-blue-900 pb-4">
            <div className="header-left flex items-center gap-3">
              <img
                src="/assets/generated/pathlab-logo-transparent.dim_120x120.png"
                alt="Logo"
                className="logo h-14 w-14"
              />
              <div>
                <p className="lab-name text-xl font-bold text-blue-900">
                  {LAB_INFO.name}
                </p>
                <p className="lab-sub text-xs text-gray-600">
                  {LAB_INFO.address}
                </p>
                <p className="lab-sub text-xs text-gray-600">
                  GST No: {LAB_INFO.gstNo}
                </p>
                <p className="lab-sub text-xs text-gray-600">
                  {LAB_INFO.phone}
                </p>
              </div>
            </div>
            <div className="header-right text-right">
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
          <div className="bill-to bg-blue-50 rounded-lg p-4">
            <p className="label text-xs text-gray-500 uppercase font-semibold mb-1">
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
          <div className="totals flex justify-end">
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
              <div className="grand-total flex justify-between font-bold text-base">
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
          <div className="footer text-center text-xs text-gray-400 border-t pt-3">
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
  const { data: patients } = usePatients();
  const { data: catalog } = useTestCatalog();
  const createBill = useCreateBill();

  const [patientIdx, setPatientIdx] = useState("");
  const [reportIdx, setReportIdx] = useState("");

  // Load reports for selected patient
  const { data: patientReports, isLoading: reportsLoading } = usePatientReports(
    patientIdx !== "" ? BigInt(patientIdx) : null,
  );

  const selectedReport =
    reportIdx !== "" && patientReports
      ? patientReports[Number(reportIdx)]
      : null;

  // Auto-derive line items from report tests
  const lineItems =
    selectedReport && catalog
      ? selectedReport.tests
          .map((code) => catalog.find((t) => t.code === code))
          .filter((t): t is NonNullable<typeof t> => !!t)
      : [];

  const subtotal = lineItems.reduce((s, t) => s + Number(t.price), 0);
  const gstAmt = subtotal * GST_RATE;
  const total = subtotal + gstAmt;

  const handleCreate = async () => {
    if (patientIdx === "") {
      toast.error("Please select a patient");
      return;
    }
    if (reportIdx === "") {
      toast.error("Please select a report");
      return;
    }
    if (lineItems.length === 0) {
      toast.error("The selected report has no tests in the catalog");
      return;
    }

    // reportId = array index of this report in patient's reports (as bigint)
    const reportId = BigInt(reportIdx);

    try {
      await createBill.mutateAsync({
        reportId,
        lineItems: lineItems.map((t) => ({
          testName: t.name,
          price: t.price,
        })),
      });
      toast.success("Bill created successfully!");
      onClose();
      setPatientIdx("");
      setReportIdx("");
    } catch {
      toast.error("Failed to create bill.");
    }
  };

  const handleClose = () => {
    onClose();
    setPatientIdx("");
    setReportIdx("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" data-ocid="billing.modal">
        <DialogHeader>
          <DialogTitle>Create New Bill</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Step 1: Select Patient */}
          <div className="space-y-1.5">
            <Label>Patient *</Label>
            <Select
              value={patientIdx}
              onValueChange={(v) => {
                setPatientIdx(v);
                setReportIdx("");
              }}
            >
              <SelectTrigger data-ocid="billing.select">
                <SelectValue placeholder="Select patient..." />
              </SelectTrigger>
              <SelectContent>
                {(patients ?? []).map((r, i) => (
                  <SelectItem
                    key={`${r.patient.phone}-${r.createdAt}`}
                    value={String(i)}
                  >
                    {r.patient.name} — {r.patient.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Select Report */}
          {patientIdx !== "" && (
            <div className="space-y-1.5">
              <Label>Report *</Label>
              {reportsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={reportIdx} onValueChange={setReportIdx}>
                  <SelectTrigger data-ocid="billing.input">
                    <SelectValue placeholder="Select report..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(patientReports ?? []).length === 0 ? (
                      <SelectItem value="none" disabled>
                        No reports found
                      </SelectItem>
                    ) : (
                      (patientReports ?? []).map((rep, i) => {
                        const date = new Date(
                          Number(rep.createdAt) / 1_000_000,
                        ).toLocaleDateString("en-IN");
                        return (
                          <SelectItem
                            key={String(rep.createdAt)}
                            value={String(i)}
                          >
                            #{i + 1} — {rep.tests.slice(0, 3).join(", ")}
                            {rep.tests.length > 3 ? "..." : ""} ({date})
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Step 3: Preview line items */}
          {selectedReport && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Tests from Report</p>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left py-2 px-3">Test</th>
                      <th className="text-right py-2 px-3">Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={2}
                          className="py-3 px-3 text-center text-muted-foreground"
                        >
                          No tests found in catalog for this report
                        </td>
                      </tr>
                    ) : (
                      lineItems.map((t) => (
                        <tr key={t.code} className="border-t border-border/50">
                          <td className="py-2 px-3">{t.name}</td>
                          <td className="py-2 px-3 text-right">
                            {Number(t.price).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    CGST {(CGST_RATE * 100).toFixed(0)}%
                  </span>
                  <span>₹{(subtotal * CGST_RATE).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    SGST {(SGST_RATE * 100).toFixed(0)}%
                  </span>
                  <span>₹{(subtotal * SGST_RATE).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-ocid="billing.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={
                createBill.isPending ||
                !selectedReport ||
                lineItems.length === 0
              }
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
  const { data: patients } = usePatients();
  const updateStatus = useUpdatePaymentStatus();
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const getPatientName = (_reportId: bigint) => {
    // Bills don't carry patientId — best effort
    return `Report #${_reportId.toString()}`;
  };

  // Suppress unused warning
  void patients;

  const handleStatusUpdate = async (billIdx: number, status: PaymentStatus) => {
    try {
      await updateStatus.mutateAsync({ billId: BigInt(billIdx), status });
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
                                handleStatusUpdate(idx, v as PaymentStatus)
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
