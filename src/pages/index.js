import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className="w-screen h-screen flex justify-center items-center gap-4">
      <Link className="bg-white text-black duration-150 py-1 px-2 rounded-md hover:scale-105 active:scale-95" href="/predict">稻穀含水率分析</Link>
      <Link className="bg-white text-black duration-150 py-1 px-2 rounded-md hover:scale-105 active:scale-95" href="/analyze">稻米葉色分析</Link>
    </div>
  );
}
