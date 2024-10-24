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

const data = [
    {
        name: "Alice",
        pumpCoins: 1200,
    },
    {
        name: "Bob",
        pumpCoins: 950,
    },
    {
        name: "Charlie",
        pumpCoins: 1100,
    },
    {
        name: "David",
        pumpCoins: 700,
    },
    {
        name: "Eve",
        pumpCoins: 1300,
    },
    {
        name: "Frank",
        pumpCoins: 800,
    },
    {
        name: "Grace",
        pumpCoins: 1150,
    },
];

function Leaderboard() {
  return (
    <div>
      <Table>
        <TableCaption>Updated Leaderboard.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Name</TableHead>
            <TableHead className="text-right">Pump Coins</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((data) => (
            <TableRow key={data.name}>
              <TableCell className="font-medium">{data.name}</TableCell>
              <TableCell className="text-right">
                {data.pumpCoins}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        
      </Table>
    </div>
  );
}

export default Leaderboard;
