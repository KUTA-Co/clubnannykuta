interface StatusBadgeProps {
  status: string;
  type?: "application" | "payment";
}

const applicationStatusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  reviewing: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  matched: "bg-purple-100 text-purple-800",
  inactive: "bg-gray-200 text-gray-600"
};

const paymentStatusStyles: Record<string, string> = {
  unpaid: "bg-gray-100 text-gray-800",
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-blue-100 text-blue-800"
};

const applicationStatusLabels: Record<string, string> = {
  inactive: "No Longer Interested"
};

export function StatusBadge({ status, type = "application" }: StatusBadgeProps) {
  const styles = type === "payment" ? paymentStatusStyles : applicationStatusStyles;
  const className = styles[status] || "bg-gray-100 text-gray-800";
  const label = type === "application" && applicationStatusLabels[status] ? applicationStatusLabels[status] : status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${className}`}>
      {label}
    </span>
  );
}
