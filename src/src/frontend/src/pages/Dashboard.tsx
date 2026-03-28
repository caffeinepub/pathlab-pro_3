import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, FileText, IndianRupee, Users } from "lucide-react";
import { motion } from "motion/react";
import { useDashboardStats, usePatients } from "../hooks/useQueries";

const statCards = [
  {
    key: "totalPatients",
    label: "Total Patients",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "reportsToday",
    label: "Today's Reports",
    icon: FileText,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    key: "pendingReports",
    label: "Pending Reports",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    key: "totalRevenue",
    label: "Total Revenue",
    icon: IndianRupee,
    color: "text-purple-600",
    bg: "bg-purple-50",
    prefix: "₹",
  },
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: patientRecords, isLoading: patientsLoading } = usePatients();

  return (
    <div className="space-y-6" data-ocid="dashboard.page">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
        <p className="text-muted-foreground text-sm mt-1">
          PathLab Pro Diagnostics — Laboratory Management System
        </p>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        data-ocid="dashboard.section"
      >
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const value = stats
            ? Number((stats as unknown as Record<string, bigint>)[card.key])
            : null;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="shadow-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                        {card.label}
                      </p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-16 mt-1" />
                      ) : (
                        <p className="text-3xl font-bold text-foreground mt-1">
                          {card.prefix}
                          {value ?? 0}
                        </p>
                      )}
                    </div>
                    <div className={`${card.bg} p-2.5 rounded-lg`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Patients */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Recent Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patientsLoading ? (
            <div className="space-y-2" data-ocid="dashboard.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="dashboard.table">
                <thead>
                  <tr className="border-b border-border">
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
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(patientRecords ?? []).slice(0, 8).map((record, idx) => (
                    <tr
                      key={`${record.patient.phone}-${record.createdAt}`}
                      className="border-b border-border/50 hover:bg-muted/30"
                      data-ocid={`dashboard.item.${idx + 1}`}
                    >
                      <td className="py-2.5 px-3 font-medium">
                        {record.patient.name}
                      </td>
                      <td className="py-2.5 px-3">
                        {Number(record.patient.age)} yrs
                      </td>
                      <td className="py-2.5 px-3 capitalize">
                        {record.patient.gender}
                      </td>
                      <td className="py-2.5 px-3">{record.patient.phone}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {(patientRecords ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground"
                        data-ocid="dashboard.empty_state"
                      >
                        No patients yet. Add patients to get started.
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
