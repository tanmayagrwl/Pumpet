import React from "react"
import { IoMdGift } from "react-icons/io"
import { SiSimpleanalytics } from "react-icons/si"
import { GoGear } from "react-icons/go"
import { CiMoneyBill } from "react-icons/ci";
import { GrDocumentPerformance } from "react-icons/gr";
import { MdOutlineLeaderboard } from "react-icons/md";

const first = ["O", "U", "R"]
const second = ["F", "E", "A", "T", "U", "R", "E", "S"]
const data = [
  {
    path: <IoMdGift className="w-5 h-5 m-1" />,
    title: "Rewards for Ticket Updates",
    description:
      "Motivate your team by turning ticket updates into points that can be redeemed for rewards, driving consistent progress.",
  },
  {
    path: <SiSimpleanalytics className="w-3 h-3 m-1" />,
    title: "Real-Time Analytics",
    description:
      "Get live insights into team performance and ticket flow, allowing managers to make data-driven decisions on the go.",
  },
  {
    path: <GoGear className="w-5 h-5 m-1" />,
    title: "Efficiency Dashboards",
    description:
      "Visualize team productivity with customizable dashboards, highlighting key metrics like ticket resolution time and employee contributions.",
  },
  {
    path: <MdOutlineLeaderboard className="w-5 h-5 m-1"  />,
    title: "Team Leaderboards",
    description:
      "Foster healthy competition with leaderboards that showcase top performers based on ticket updates and completion rates.",
  },
  {
    path: <CiMoneyBill className="w-5 h-5 m-1"  />,
    title: "Customizable Reward System",
    description:
      "Effortlessly schedule, assign, and comment on tasks for precise workload organization and collaboration. Stay on top of project timelines with ease and efficiency.",
  },
  {
    path: <GrDocumentPerformance className="w-5 h-5 m-1"  />,
    title: "Performance Trends",
    description:
      "Identify long-term patterns with detailed reports on ticket activity and team efficiency, helping managers spot areas for improvement.",
  },
]
function Features() {
  return (
    <section id="features" className="py-24">
      <div className=" flex gap-x-6 2xl:gap-x-12 w-full justify-center text-primary text-xs md:text-base 2xl:text-lg ">
        <div className="flex justify-center gap-x-3 2xl:gap-x-">
          {first.map((letter, index) => {
            return (
              <span key={letter} className="font-light md:font-bold ">
                {letter}
              </span>
            )
          })}
        </div>
        <div className="flex justify-center gap-x-3 2xl:gap-x-6">
          {second.map((letter, index) => {
            return (
              <span key={index} className="font-light md:font-bold">
                {letter}
              </span>
            )
          })}
        </div>
      </div>
      {/*  */}
      <div className="flex flex-col w-full justify-center text-center ">
        <h1 className="scroll-m-20 text-3xl md:text-4xl font-extrabold tracking-tight lg:text-5xl py-5 ">
          Discover Pumpet's Features
        </h1>
        <p className="leading-7 mx-4 max-w-4xl self-center text-[#696969] 2xl:text-xl pb-10">
          Pumpet boosts ticket activity by rewarding employees for timely
          updates and movements. Our system tracks every action, turning
          progress into points that can be redeemed for rewards. At the same
          time, our analytics engine provides detailed insights on team
          efficiency, helping managers spot trends, optimize performance, and
          drive success.
        </p>
      </div>
      {/*  */}
      <div className="flex items-center justify-center w-full px-4 lg:px-32">
        <div className="grid grid-cols-1 grid-rows-6 md:grid-cols-2 md:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2 w-full gap-7 ">
          {data.map((item, index) => (
            <div
              key={item.title}
              className="flex w-full flex-col bg-[#FBFBFB] p-5 items-center gap-y-4 rounded-xl"
            >
              {/* <Image src={item.path} alt={item.title} width={50} height={50} /> */}
              <div
                className={`p-2 rounded-full flex items-center justify-center bg-primary/50`}
              >
                {item.path}
              </div>
              <h1 className="font-bold text-lg 2xl:text-2xl ">{item.title}</h1>
              <p className="text-center text-sm text-[#696969] 2xl:text-xl">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
