import React from 'react';

function Page() {
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h2 className="text-2xl font-semibold mb-6">Ticket Management Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-medium">Weekly Tickets Resolved</h3>
          <p className="text-2xl font-bold">50</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-medium">Monthly Tickets Resolved</h3>
          <p className="text-2xl font-bold">200</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-medium">Tickets Reopened</h3>
          <p className="text-2xl font-bold">5</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-medium">Overall Tickets Resolved by Teams</h3>
          <p className="text-2xl font-bold">1200</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-medium">Daily Ticket Updates Frequency</h3>
          <p className="text-2xl font-bold">5 times/day</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-medium">Common Link for Reopened Tickets</h3>
          <p className="text-2xl font-bold">Details Link</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-medium">Most Efficient Employee</h3>
          <p className="text-2xl font-bold">John Doe</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-medium">Least Efficient Employee</h3>
          <p className="text-2xl font-bold">Jane Smith</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-medium">Employee of the Month (Most Efficient)</h3>
          <p className="text-2xl font-bold">John Doe</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-medium">Employee of the Month (Least Efficient)</h3>
          <p className="text-2xl font-bold">Jane Smith</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-medium">Tickets Stuck on Max Time</h3>
          <p className="text-2xl font-bold">In Review</p>
        </div>
      </div>
    </div>
  );
}

export default Page;
