import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const activity = [
  {
    activity: "Invoice INV001 - Payment received",
    pumpetCoins: 10,
  },
  {
    activity: "Invoice INV002 - Payment pending",
    pumpetCoins: 5,
  },
  {
    activity: "Invoice INV003 - Payment overdue",
    pumpetCoins: 0,
  },
  {
    activity: "Invoice INV004 - Payment received",
    pumpetCoins: 10,
  },
  {
    activity: "Invoice INV005 - Payment pending",
    pumpetCoins: 5,
  },
  {
    activity: "Invoice INV006 - Payment overdue",
    pumpetCoins: 0,
  },
  {
    activity: "Invoice INV007 - Payment received",
    pumpetCoins: 10,
  },
];
function Page() {
  return (
    <div className="px-40 pt-10">
      <Table>
        <TableCaption>All done</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Activity feed</TableHead>
            <TableHead className="text-right">Activity feed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activity.map((activity) => (
            <TableRow key={activity.activity}>
              <TableCell className="font-medium text-left">
                {activity.activity}
              </TableCell>
              <TableCell className="font-medium text-right">
                {activity.pumpetCoins} Pumpet Coins{" "}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default Page;
