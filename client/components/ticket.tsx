"use client"
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getIssues } from "@/lib/actions/get-issues";

interface TicketProps {
  tickets: {
    id: string;
    name: string;
    summary: string;
    status: string;
    priority: string;
    statusColor: string;
    priorityColor: string;
  }[];
}

const Ticket: React.FC<TicketProps> = ({ tickets }) => {
  const [fetchedTickets, setFetchedTickets] = useState<TicketProps["tickets"]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getIssues();
      const mappedTickets = data.data.issues.map((issue: any) => ({
        id: issue.id,
        name: issue.key,
        summary: issue.summary,
        status: issue.status.name,
        priority: issue.priority.name,
        statusColor: issue.status.color,
        priorityColor: issue.priority.iconUrl,
      }));
      setFetchedTickets(mappedTickets);
      console.log(mappedTickets);
    };
    fetchData();
  }, []);

  if (!fetchedTickets.length) {
    return <p>No tickets available</p>;
  }

  return (
    <div className="flex flex-wrap gap-5">
      {fetchedTickets.map((ticket) => (
        <Card
          key={ticket.id}
          className="min-w-[400px] border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <CardHeader className="p-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              {ticket.name}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              {ticket.summary}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Status:</p>
              <span className={`text-sm font-medium text-gray-700`}>
                {ticket.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Priority:</p>
              <span className={`text-sm font-medium text-gray-700`}>
                {ticket.priority}
              </span>
            </div>
          </CardContent>
          {/* <CardFooter className="p-4 border-t border-gray-200 flex justify-end space-x-3">
            <button className="text-gray-600 text-sm hover:text-gray-800">
              View
            </button>
            <button className="text-gray-600 text-sm hover:text-gray-800">
              Edit
            </button>
          </CardFooter> */}
        </Card>
      ))}
    </div>
  );
};

const App = () => {
  return (
    <div className="p-5">
      <Ticket tickets={[]} />
    </div>
  );
};

export default App;