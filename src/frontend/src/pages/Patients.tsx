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
import { Plus, Search, User } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Gender } from "../backend";
import { useAddPatient, usePatients } from "../hooks/useQueries";

export default function Patients() {
  const { data: patientRecords, isLoading } = usePatients();
  const addPatient = useAddPatient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: Gender.male as Gender,
    phone: "",
    address: "",
  });

  const filtered = (patientRecords ?? []).filter(
    (r) =>
      r.patient.name.toLowerCase().includes(search.toLowerCase()) ||
      r.patient.phone.includes(search),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addPatient.mutateAsync({
        name: form.name,
        age: BigInt(form.age || 0),
        gender: form.gender,
        phone: form.phone,
        address: form.address,
      });
      toast.success("Patient added successfully!");
      setOpen(false);
      setForm({
        name: "",
        age: "",
        gender: Gender.male,
        phone: "",
        address: "",
      });
    } catch {
      toast.error("Failed to add patient.");
    }
  };

  return (
    <div className="space-y-6" data-ocid="patients.page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Patients</h2>
          <p className="text-muted-foreground text-sm">
            Manage patient records
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="patients.open_modal_button">
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" data-ocid="patients.dialog">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="pat-name">Full Name *</Label>
                  <Input
                    id="pat-name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Rajesh Kumar Sharma"
                    required
                    data-ocid="patients.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pat-age">Age *</Label>
                  <Input
                    id="pat-age"
                    type="number"
                    min={0}
                    max={150}
                    value={form.age}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, age: e.target.value }))
                    }
                    placeholder="35"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pat-gender">Gender *</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, gender: v as Gender }))
                    }
                  >
                    <SelectTrigger id="pat-gender" data-ocid="patients.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Gender.male}>Male</SelectItem>
                      <SelectItem value={Gender.female}>Female</SelectItem>
                      <SelectItem value={Gender.other}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="pat-phone">Phone *</Label>
                  <Input
                    id="pat-phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="pat-address">Address</Label>
                  <Input
                    id="pat-address"
                    value={form.address}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="Mumbai, Maharashtra"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  data-ocid="patients.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addPatient.isPending}
                  data-ocid="patients.submit_button"
                >
                  {addPatient.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Patient
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-ocid="patients.search_input"
        />
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Patient List
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2" data-ocid="patients.loading_state">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="patients.table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      #
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Name
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Age
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Gender
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Phone
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record, idx) => (
                    <tr
                      key={`${record.patient.phone}-${record.createdAt}`}
                      className="border-b border-border/50 hover:bg-muted/30"
                      data-ocid={`patients.item.${idx + 1}`}
                    >
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        {record.patient.name}
                      </td>
                      <td className="py-2.5 px-3">
                        {Number(record.patient.age)}
                      </td>
                      <td className="py-2.5 px-3 capitalize">
                        {record.patient.gender}
                      </td>
                      <td className="py-2.5 px-3">{record.patient.phone}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {record.patient.address || "—"}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-muted-foreground"
                        data-ocid="patients.empty_state"
                      >
                        No patients found. Add your first patient.
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
