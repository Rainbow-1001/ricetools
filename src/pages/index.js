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
    <div className="w-screen h-screen flex justify-center items-center gap-6 bg-gray-100">
      <Link 
        className="bg-black text-white px-6 py-3 rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all duration-150 font-medium"
        href="/predict"
      >
        稻穀含水率分析
      </Link>
      <Link 
        className="bg-black text-white px-6 py-3 rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all duration-150 font-medium"
        href="/analyze"
      >
        稻米葉色分析
      </Link>
    </div>
  );
}