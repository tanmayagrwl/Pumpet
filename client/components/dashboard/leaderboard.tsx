"use client";

import React, { useEffect, useState } from "react";
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
import axios from "axios";

interface AuditData {
  name: string;
  pumpCoins: number;
}

function Leaderboard() {
  const [auditData, setAuditData] = useState<AuditData[]>([]);
  const [pointsData, setPointsData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5050/api/v1/jira/projects/cbc17885-f5d9-4d39-8117-038eedef45e5/audit",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const auditResult = response.data;
        setAuditData(auditResult);

        const response2 = await axios.get(
          "http://localhost:5050/api/v1/jira/projects/cbc17885-f5d9-4d39-8117-038eedef45e5/points",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const pointResult = response2.data;
        setPointsData(pointResult);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

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
          {auditData.map((data) => (
            <TableRow key={data.name}>
              <TableCell className="font-medium">{data.name}</TableCell>
              <TableCell className="text-right">{data.pumpCoins}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default Leaderboard;
