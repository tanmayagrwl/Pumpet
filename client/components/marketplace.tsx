"use client"
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface VoucherProps {
  vouchers: {
    id: string;
    companyName: string;
    couponName: string;
    couponCode: string;
    pumpCoinsRequired: number;
  }[];
}

const Voucher: React.FC<VoucherProps> = ({ vouchers }) => {
  const [purchasedVouchers, setPurchasedVouchers] = useState<string[]>([]);

  const handleBuy = (id: string) => {
    setPurchasedVouchers((prevState) =>
      prevState.includes(id)
        ? prevState.filter((voucherId) => voucherId !== id)
        : [...prevState, id]
    );
  };

  if (!vouchers.length) {
    return <p>No vouchers available</p>;
  }

  return (
    <div className="flex flex-grow gap-5">
      {vouchers.map((voucher) => (
        <Card
          key={voucher.id}
          className="min-w-[400px] border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <CardHeader className="p-4">
            <CardTitle className="text-lg font-semibold text-gray-800">
              {voucher.companyName}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              {purchasedVouchers.includes(voucher.id)
                ? "Purchased!"
                : voucher.couponName}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {purchasedVouchers.includes(voucher.id) ? (
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Coupon Code:</p>
                <span className="text-sm font-medium text-gray-700">
                  {voucher.couponCode}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Pump Coins Required:</p>
              <span className="text-sm font-medium text-gray-700">
                {voucher.pumpCoinsRequired}
              </span>
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              className="text-gray-600 text-sm hover:text-gray-800"
              onClick={() => handleBuy(voucher.id)}
            >
              {purchasedVouchers.includes(voucher.id) ? "Undo" : "Buy"}
            </button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

// Sample voucher data
const sampleVouchers = [
  {
    id: "1",
    companyName: "Brand A",
    couponName: "10% off on all products",
    couponCode: "SAVE10",
    pumpCoinsRequired: 50,
  },
  {
    id: "2",
    companyName: "Brand B",
    couponName: "Free shipping",
    couponCode: "FREESHIP",
    pumpCoinsRequired: 30,
  },
  {
    id: "3",
    companyName: "Brand C",
    couponName: "Buy 1 Get 1 Free",
    couponCode: "BOGO",
    pumpCoinsRequired: 100,
  },
];

// Rendering the Voucher component with sample data
const App = () => {
  return (
    <div className="p-5">
      <Voucher vouchers={sampleVouchers} />
    </div>
  );
};

export default App;
